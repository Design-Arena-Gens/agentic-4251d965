import Replicate from "replicate";

const replicate =
  process.env.REPLICATE_API_TOKEN != null
    ? new Replicate({
        auth: process.env.REPLICATE_API_TOKEN
      })
    : null;

const MODEL_VERSION =
  process.env.REPLICATE_MODEL_VERSION ??
  "fofr/flux-portraits:03a7d03594ed827ad1d948e57808b437a1d0fc5062b0e3575c2b90f77fa1397b";

const NEGATIVE_PROMPT =
  "blurry, bad quality, distorted face, deformed hands, mangled limbs, duplicate people, disproportional body, caricature, illustration, painting, text";

export interface GenerationOptions {
  shots?: number;
  promptAdditions?: string[];
}

export async function generateWeddingPortfolio(
  referenceUrls: string[],
  options: GenerationOptions = {}
): Promise<string[]> {
  if (!replicate) {
    throw new Error("Replicate client not configured. Set REPLICATE_API_TOKEN.");
  }

  if (!referenceUrls.length) {
    throw new Error("At least one reference image is required.");
  }

  if (referenceUrls.length > 6) {
    throw new Error("Maximum of 6 reference images allowed.");
  }

  const shots = options.shots ?? 12;

  const basePrompt =
    "High-end Indian wedding portrait photography of the same person wearing couture outfits. Ultra-realistic, 4K DSLR, volumetric lighting, candid poses, authentic skin texture, jewelry styling, cinematic background.";

  const wardrobeLookbook = [
    "regal sherwani with sequin stole inside palace corridor",
    "ivory lehenga with pastel dupatta in royal courtyard",
    "emerald indo-western tux on Mumbai rooftop at sunset",
    "sequin saree with chandbali jewelry inside art-deco ballroom",
    "traditional maroon bridal lehenga surrounded by marigold decor",
    "champagne sherwani with pagdi in heritage haveli courtyard",
    "pastel gown with veil shot at Goa beach golden hour",
    "silk angrakha sherwani near Jaipur stepwell backdrop",
    "flowing organza saree under fairy lights at sangeet stage",
    "velvet bandhgala suit beside vintage car at night reception"
  ];

  const promptVariants = (options.promptAdditions?.length
    ? options.promptAdditions
    : wardrobeLookbook
  ).slice(0, shots);

  const generations: string[] = [];

  for (const lookbookPrompt of promptVariants) {
    const prompt = `${basePrompt} Outfit focus: ${lookbookPrompt}.`;
    const modelVersion =
      MODEL_VERSION as `${string}/${string}` | `${string}/${string}:${string}`;

    const input = {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      image_urls: referenceUrls,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      image_dimensions: "1024x1024",
      output_format: "png"
    };

    const response = (await replicate.run(modelVersion, {
      input
    })) as unknown;

    if (Array.isArray(response)) {
      const urls = response.filter((item) => typeof item === "string") as string[];
      generations.push(...urls);
    } else if (
      typeof response === "object" &&
      response !== null &&
      "image" in (response as Record<string, unknown>)
    ) {
      const url = (response as Record<string, unknown>).image;
      if (typeof url === "string") {
        generations.push(url);
      }
    }

    if (generations.length >= shots) {
      break;
    }
  }

  if (!generations.length) {
    throw new Error("Generation failed to produce any images.");
  }

  return generations.slice(0, shots);
}
