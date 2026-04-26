/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, act } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { NavigationProgress } from "@/components/navigation-progress";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));

const mockUsePathname = usePathname as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  mockUsePathname.mockReturnValue("/dashboard");
});

afterEach(() => {
  jest.useRealTimers();
});

function addLink(href: string) {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  document.body.appendChild(a);
  return () => document.body.removeChild(a);
}

describe("NavigationProgress", () => {
  it("renders nothing when idle", () => {
    const { container } = render(<NavigationProgress />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the bar when an internal link is clicked", () => {
    const { container } = render(<NavigationProgress />);
    const cleanup = addLink("/dashboard/crm");

    act(() => { document.querySelector("a")!.click(); });

    expect(container.firstChild).not.toBeNull();
    cleanup();
  });

  it("does not show for external http links", () => {
    const { container } = render(<NavigationProgress />);
    const cleanup = addLink("https://external.com/page");

    act(() => { document.querySelector("a")!.click(); });

    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it("does not show for protocol-relative external links", () => {
    const { container } = render(<NavigationProgress />);
    const cleanup = addLink("//cdn.example.com/asset.js");

    act(() => { document.querySelector("a")!.click(); });

    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it("does not show for hash-only links", () => {
    const { container } = render(<NavigationProgress />);
    const cleanup = addLink("#section");

    act(() => { document.querySelector("a")!.click(); });

    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it("does not show when clicking the current page link", () => {
    mockUsePathname.mockReturnValue("/dashboard/crm");
    const { container } = render(<NavigationProgress />);
    const cleanup = addLink("/dashboard/crm");

    act(() => { document.querySelector("a")!.click(); });

    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it("hides the bar after navigation completes and the timeout elapses", () => {
    const { container, rerender } = render(<NavigationProgress />);
    const cleanup = addLink("/dashboard/crm/leads");

    // Start navigation
    act(() => { document.querySelector("a")!.click(); });
    expect(container.firstChild).not.toBeNull();

    // Simulate route change
    mockUsePathname.mockReturnValue("/dashboard/crm/leads");
    act(() => { rerender(<NavigationProgress />); });

    // Bar is in "completing" state — still in DOM
    expect(container.firstChild).not.toBeNull();

    // Advance past the 350ms hide timeout
    act(() => { jest.advanceTimersByTime(400); });

    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it("advances the bar width over time while loading", () => {
    const { container } = render(<NavigationProgress />);
    const cleanup = addLink("/dashboard/crm");

    act(() => { document.querySelector("a")!.click(); });

    const inner = container.firstChild?.firstChild as HTMLElement;
    const widthAfterClick = parseFloat(inner?.style.width ?? "0");

    act(() => { jest.advanceTimersByTime(500); });

    const widthAfterTick = parseFloat(inner?.style.width ?? "0");
    expect(widthAfterTick).toBeGreaterThan(widthAfterClick);

    cleanup();
  });
});
