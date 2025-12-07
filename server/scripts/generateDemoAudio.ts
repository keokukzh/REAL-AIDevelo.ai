import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// dotenv.config({ path: path.join(__dirname, "../.env") });

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
// Using a known high-quality voice ID (Rachel is often default, but let's stick to the user's example or a generic one if that fails).
// The user provided "EXAVITQu4vr4xnSDxMaL" (Sarah - Soft & expressive).
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; 

if (!ELEVEN_API_KEY) {
    console.error("ERROR: ELEVENLABS_API_KEY not found in .env");
    process.exit(1);
}

async function generateDemo(text: string, filename: string) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  
  // Adjust path to point to the frontend public folder
  const outputPath = path.join(__dirname, "../../public/audio", `${filename}.mp3`);

  console.log(`Generating ${filename}...`);

  try {
      const response = await axios.post(
        url,
        {
          text,
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.75,
          },
          model_id: "eleven_multilingual_v2",
        },
        {
          headers: {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer", // Important for audio
        }
      );

      fs.writeFileSync(outputPath, response.data);
      console.log(`✓ Audio created: ${outputPath}`);
  } catch (error: any) {
      console.error(`Error generating ${filename}:`, error.response?.data || error.message);
  }
}

async function main() {
  await generateDemo(
    "Grüezi! Ich bin der AIDevelo Voice Agent. Ich nehme Ihre Anrufe rund um die Uhr entgegen, beantworte Fragen und buche Termine direkt in Ihrem Kalender – zuverlässig, freundlich und immer verfügbar.",
    "demo_de"
  );

  await generateDemo(
    "Bonjour! Je suis l’assistant vocal AIDevelo. Je réponds aux appels de vos clients, qualifie leurs demandes et organise des rendez-vous pour votre entreprise, 24h sur 24.",
    "demo_fr"
  );

  await generateDemo(
    "Ciao! Sono l’assistente vocale AIDevelo. Rispondo alle chiamate, raccolgo le informazioni del cliente e fisso appuntamenti nel vostro calendario, sempre in modo cortese e professionale.",
    "demo_it"
  );
}

main();
