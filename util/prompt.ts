interface PromptProp {
  id: string;
  text: string;
  imgSrc?: string;
  category: string;
  subCategory: string;
  author: string;
  createdAt: Date;
  modelName: string;
}

export const prompts: PromptProp[] = [
  {
    id: "1",
    text: "A surreal, dreamlike forest filled with towering, impossibly thin trees that stretch high into the sky. Their delicate leaves shimmer in a smooth gradient of deep indigo blues fading into rich purples, glowing faintly as if illuminated from within. A soft, ethereal mist curls upward from the forest floor, drifting between the trees and creating a mysterious, otherworldly atmosphere. The ground is carpeted with faintly glowing moss, adding subtle reflections of blue and violet. The air feels still yet enchanted, as if the forest itself is alive with quiet magic. Wide-angle perspective, ultra-realistic details, cinematic lighting, high resolution, fantasy concept art. --ar 16:9 ",
    imgSrc: "/img1.png",
    category: "Image",
    subCategory: "Nature",
    author: "PromptSwap",
    createdAt: new Date(),
    modelName: "Gemini",
  },
  {
    id: "2",
    text: "A bustling cyberpunk cityscape at night, illuminated by neon lights and holographic advertisements. The streets are filled with a diverse crowd of people and futuristic vehicles, all under a sky filled with flying cars and digital billboards. The atmosphere is vibrant and chaotic, with a sense of advanced technology and urban life intertwining. Wide-angle perspective, ultra-realistic details, cinematic lighting, high resolution, sci-fi concept art. --ar 16:9",
    imgSrc: "/img2.png",
    category: "Image",
    subCategory: "Cyberpunk",
    author: "PromptSwap",
    createdAt: new Date(),
    modelName: "Gemini",
  },
  {
    id: "3",
    text: "Recreate a vintage wooden writing desk with ornate carvings in a photorealistic. Maintain the original essence while enhancing texture, lighting, proportions, and color accuracy. Focus on high detail, accurate representation, and a professional, polished finish. Use --ar 16:9 and ensure it looks consistent with modern high-quality photography.",
    imgSrc: "/img3.png",
    category: "Image",
    subCategory: "Furniture",
    author: "PromptSwap",
    createdAt: new Date(),
    modelName: "ChatGPT",
  },
  {
    id: "4",
    text: "Recreate a classic Japanese torii gate at sunset in ultra-photorealistic style. Preserve its traditional wooden structure and vibrant red paint, but enhance the texture of the wood, the glow of the sunset behind it, and the calm rippling water below. Cinematic lighting, wide-angle perspective, --ar 16:9.",
    imgSrc: "/img4.png",
    category: "Image",
    subCategory: "Nature",
    author: "PromptSwap",
    createdAt: new Date(),
    modelName: "Grok",
  },
];
