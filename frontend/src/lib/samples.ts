// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

const human = `So I finally got round to fixing the bike last weekend. Took way longer than it should've because the chain tool I bought was the wrong size, classic. Ended up borrowing one from Dave next door who, bless him, then spent forty minutes telling me about his allotment. Anyway the gears still skip a bit on the big cog but it rides. Might take it in to the shop if it keeps doing it.`;

const ai = `Regular bicycle maintenance is essential for ensuring both safety and performance. By routinely inspecting key components such as the chain, brakes, and tires, cyclists can identify potential issues before they become serious problems. Additionally, proper lubrication of the drivetrain not only extends its lifespan but also enhances overall riding efficiency. Ultimately, investing a small amount of time in maintenance can lead to a smoother, more enjoyable cycling experience.`;

// The AI sample with zero-width spaces and Cyrillic look-alikes mixed in, a common evasion trick.
const CYRILLIC: Record<string, string> = { a: "\u0430", e: "\u0435", o: "\u043e", c: "\u0441", p: "\u0440" };
const disguised = [...ai]
  .map((ch, i) => (i % 3 === 0 && CYRILLIC[ch] ? CYRILLIC[ch] : ch) + (i % 5 === 0 ? "\u200b" : ""))
  .join("");

export const SAMPLES = [
  { label: "Human sample", text: human },
  { label: "AI sample", text: ai },
  { label: "Mixed sample", text: `${human}\n\n${ai}` },
  { label: "Disguised AI", text: disguised },
];
