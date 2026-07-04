import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Accidental } from 'vexflow';

interface SheetMusicProps {
  chords: string[][]; // e.g. [["C4", "E4", "G4"], ["D4", "F4", "A4"]]
}

export const SheetMusic: React.FC<SheetMusicProps> = ({ chords }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous drawing
    containerRef.current.innerHTML = '';

    if (chords.length === 0) {
      // Draw an empty stave
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(300, 140);
      const context = renderer.getContext();
      
      // Styling context to match dark spacecraft UI
      context.setFillStyle('#f5b971');
      context.setStrokeStyle('#f5b971');

      const stave = new Stave(10, 10, 280);
      stave.addClef('treble');
      stave.setContext(context).draw();
      return;
    }

    // Dynamic width based on the number of chords to make a scrolling paper-tape feel
    const noteWidth = 100;
    const padding = 60;
    const staveWidth = chords.length * noteWidth + padding + 40;
    const height = 140;

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(staveWidth, height);
    const context = renderer.getContext();

    // Custom stylings for staff elements
    context.setFillStyle('#f5b971');
    context.setStrokeStyle('#f5b971');

    const stave = new Stave(10, 10, staveWidth - 20);
    stave.addClef('treble');
    stave.setContext(context).draw();

    try {
      // Map Rocky's notes to VexFlow's format
      const staveNotes = chords.map((chord) => {
        const keys = chord.map((note) => {
          // Convert note structure: "C#4" -> "c#/4", "Bb3" -> "bb/3"
          const match = note.match(/^([A-G])(#|b)?(\d)$/i);
          if (!match) return 'c/4';
          const letter = match[1].toLowerCase();
          const accidental = match[2] || '';
          const octave = match[3];
          return `${letter}${accidental}/${octave}`;
        });

        const staveNote = new StaveNote({
          keys: keys,
          duration: 'q',
        });

        // Add matching styling to individual notes
        staveNote.setStyle({ fillStyle: '#ff9d42', strokeStyle: '#f5b971' });

        // Bind accidentals to keys
        chord.forEach((note, idx) => {
          const match = note.match(/^([A-G])(#|b)?(\d)$/i);
          if (match && match[2]) {
            staveNote.addModifier(new Accidental(match[2]), idx);
          }
        });

        return staveNote;
      });

      // Format and render notes on the staff
      Formatter.FormatAndDraw(context, stave, staveNotes);

      // Customize output SVG paths to glow orange
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        // Apply sci-fi HUD styling filters
        svgElement.style.filter = 'drop-shadow(0 0 3px rgba(255, 157, 66, 0.4))';
        svgElement.querySelectorAll('path').forEach((path) => {
          // If vexflow colored it black, swap with console amber
          const currentStroke = path.getAttribute('stroke');
          const currentFill = path.getAttribute('fill');
          if (currentStroke === '#000000' || currentStroke === 'black' || !currentStroke) {
            path.setAttribute('stroke', '#f5b971');
          }
          if (currentFill === '#000000' || currentFill === 'black' || !currentFill) {
            path.setAttribute('fill', '#ff9d42');
          }
        });
      }
    } catch (err) {
      console.error('VexFlow rendering error:', err);
    }
  }, [chords]);

  return (
    <div className="w-full overflow-x-auto bg-[#0a0c16]/50 p-4 border border-[#f5b971]/20 rounded-lg flex items-center justify-start scrollbar-thin">
      <div ref={containerRef} className="min-w-full" />
    </div>
  );
};
