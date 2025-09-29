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
    text: "3D rendering of a Chinese style mecha warrior, tall and thin, wearing a pink and purple hooded suit, the clothing incorporates plant violet elements, hip-hop style, fashionable and elegant. The warrior's eyes are cool and electric, and his posture is elegant. He is suspended in a white and clean stage background with bright colors, presenting an overall cool and elegant atmosphere. Close-up, high contrast.",
    imgSrc: "/img2.png",
    category: "Image",
    subCategory: "Mecha",
    author: "Cookbook",
    createdAt: new Date("September 14, 2025"),
    modelName: "Grok Imagine",
  },
  {
    id: "2",
    text: "Retro style photo of a small pug wearing round retro sunglasses and a black or dark brown curly wig. The background is pure yellow, very bright, creating a lively atmosphere. The dog's expression is natural, his eyes are smart, and he seems to be looking at the camera curiously. High-definition realistic photography, close-up.",
    imgSrc: "/img3.png",
    category: "Image",
    subCategory: "Animals",
    author: "Cookbook",
    createdAt: new Date("September 14, 2025"),
    modelName: "Nano Banana",
  },
  {
    id: "3",
    text: "Wide panning cinematic shot of a short white man in silhouette, dancing slowly to deep house rhythms. His back faces the camera completely, obscuring his identity. He wears a bucket hat and loose, flowing clothes. The shot is soft-focus with atmospheric haze, motion blur trailing his movements, and heavy film grain. The background glows with a rich red gradient, evoking an underground club scene with moody, analog texture.",
    imgSrc: "/img4.png",
    category: "Image",
    subCategory: "Dance",
    author: "Cookbook",
    createdAt: new Date("September 14, 2025"),
    modelName: "Nano Banana",
  },
  {
    id: "4",
    text: "A minimalist futuristic portrait of a male mechanical artist, rendered with hyper-precise detail. His body is composed of sleek, lustrous metallic components, polished to a mirror-like sheen that reflects cold technological brilliance. His face is a harmonious fusion of art and engineering — a complex yet orderly arrangement of mechanical forms, wires, and panels that flow seamlessly like sculpted geometry. His eyes shimmer with innovation, glowing softly through intricate inner structures, radiating intelligence and creative depth. Set against a pure white, empty background, all attention converges on his presence. The composition embodies the balance between futurism and minimalism — breathtakingly simple, yet profound, evoking both the elegance of high design and the ingenuity of a visionary creator.",
    imgSrc: "/img5.png",
    category: "Image",
    subCategory: "Robots",
    author: "Cookbook",
    createdAt: new Date("September 14, 2025"),
    modelName: "Grok Imagine",
  },
  {
    id: "5",
    text: "Glitch art portrait of a lone figure standing against a pure white void. She wears torn, weathered white clothing, the fabric frayed yet graceful, carrying echoes of a forgotten past. From her right side, intricate mechanical extensions emerge — polished metal, exposed wiring, and cold futuristic implants seamlessly fused with her body. The glitching distortion fragments her silhouette, flickering with digital artifacts and chromatic aberrations, as though her existence is unstable. The minimalist composition — stark figure against empty whiteness — heightens the sense of isolation, beauty, and melancholic tension. The image captures a haunting balance between decay and futurism, fragility and machine precision, evoking the feeling of an unfinished story suspended in time.",
    imgSrc: "/img6.png",
    category: "Image",
    subCategory: "Glitch",
    author: "Cookbook",
    createdAt: new Date("September 14, 2025"),
    modelName: "Grok Imagine",
  },
  {
    id: "6",
    text: "A hyper-realistic digital close-up of a calico kitten, its white, orange, and black fur fluffed out in soft detail. Seen through a fisheye lens, its face is comically distorted — an oversized round head, huge gleaming green eyes stretched wide with silly curiosity, a tiny nose pushed forward, and an exaggerated toothy grin that makes it look delightfully goofy. The perspective warps the proportions so the kitten's cheeks puff out and its forehead bulges slightly, adding playful charm. The background shows a softly blurred, warm indoor room, also bent by the fisheye curve, enhancing the quirky effect. Rendered in vibrant colors and fine fur detail, the image radiates pure cuteness with a touch of comic exaggeration, like an irresistibly funny and adorable selfie.",
    imgSrc: "/img7.png",
    category: "Image",
    subCategory: "Animals",
    author: "Cookbook",
    createdAt: new Date("September 14, 2025"),
    modelName: "Grok Imagine",
  },
];
