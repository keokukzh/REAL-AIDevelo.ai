import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceHero as Hero } from "../voiceagent/VoiceHero";

describe("Hero", () => {
  it("renders headline and key value proposition", () => {
    render(<Hero />);
    expect(screen.getByText(/Voice Agent/i)).toBeInTheDocument();
    const schweizerTexts = screen.getAllByText(/Schweizerdeutsch/i);
    expect(schweizerTexts.length).toBeGreaterThan(0);
  });

  it("invokes onboarding when primary CTA is clicked", () => {
    const onStartOnboarding = vi.fn();
    render(<Hero onStartOnboarding={onStartOnboarding} />);
    const cta = screen.getAllByLabelText(/Onboarding starten/i)[0];
    fireEvent.click(cta);
    expect(onStartOnboarding).toHaveBeenCalledTimes(1);
  });

  it("scrolls to demo section when secondary CTA is clicked", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo");
    const demo = document.createElement("div");
    demo.id = "demo";
    demo.getBoundingClientRect = () => ({
      top: 150,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
    document.body.appendChild(demo);

    render(<Hero />);
    fireEvent.click(screen.getByLabelText(/Demo-Sektion scrollen/i));

    expect(scrollSpy).toHaveBeenCalled();
    document.body.removeChild(demo);
    scrollSpy.mockRestore();
  });
});
