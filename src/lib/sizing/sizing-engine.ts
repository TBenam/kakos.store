export type ClothingCategory = 
  | 'T-shirts'
  | 'Sweats / Hoodies'
  | 'Jeans'
  | 'Pantalons'
  | 'Ensembles'
  | 'Culottes / Shorts'
  | 'Vestes / Doudounes'
  | 'Salopettes'
  | string;

export type FitPreference = 'fitted' | 'regular' | 'oversize';

export interface SizingInput {
  heightCm: number; // e.g. 178
  weightKg: number; // e.g. 78
  fitPreference: FitPreference;
  category: ClothingCategory;
  availableSizes?: string[]; // e.g. ['S', 'M', 'L', 'XL'] or ['30', '32', '34', '36']
}

export interface MorphologyProfile {
  bmi: number;
  bodyType: 'slender' | 'athletic' | 'average' | 'stocky' | 'plus';
  bodyTypeLabel: string;
  chestEstimateCm: number;
  waistEstimateCm: number;
  heightScale: number; // For visual mannequin scaling (0.85 to 1.15)
  widthScale: number;  // For visual mannequin scaling (0.80 to 1.35)
}

export interface SizingRecommendation {
  recommendedSize: string;
  confidenceScore: number; // 0 to 100
  morphology: MorphologyProfile;
  fitExplanation: string;
  sizeAdvice: string;
  alternativeSize?: string;
  alternativeAdvice?: string;
}

/**
 * Calculates morphology metrics from height and weight
 */
export function calculateMorphology(heightCm: number, weightKg: number): MorphologyProfile {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // Chest and waist estimation models based on anthropometric averages for adult men
  const chestEstimateCm = Math.round(weightKg * 1.15 + (heightCm - 170) * 0.25);
  const waistEstimateCm = Math.round(weightKg * 1.02 + (heightCm - 170) * 0.15);

  let bodyType: MorphologyProfile['bodyType'] = 'average';
  let bodyTypeLabel = 'Silhouette Standard';

  if (bmi < 20.5) {
    bodyType = 'slender';
    bodyTypeLabel = 'Silhouette Élancée / Fine';
  } else if (bmi >= 20.5 && bmi < 24.5) {
    bodyType = 'athletic';
    bodyTypeLabel = 'Silhouette Athlétique';
  } else if (bmi >= 24.5 && bmi < 28) {
    bodyType = 'average';
    bodyTypeLabel = 'Silhouette Régulière / Solide';
  } else if (bmi >= 28 && bmi < 32) {
    bodyType = 'stocky';
    bodyTypeLabel = 'Silhouette Robuste / Carrée';
  } else {
    bodyType = 'plus';
    bodyTypeLabel = 'Silhouette Forte';
  }

  // Scaling ratios for dynamic mannequin morphing
  const heightScale = Math.min(Math.max((heightCm - 150) / 50 * 0.3 + 0.85, 0.85), 1.15);
  const widthScale = Math.min(Math.max((weightKg - 50) / 70 * 0.55 + 0.80, 0.80), 1.40);

  return {
    bmi: Math.round(bmi * 10) / 10,
    bodyType,
    bodyTypeLabel,
    chestEstimateCm,
    waistEstimateCm,
    heightScale,
    widthScale,
  };
}

/**
 * Main Sizing Recommendation Engine
 */
export function getRecommendedSize(input: SizingInput): SizingRecommendation {
  const { heightCm, weightKg, fitPreference, category, availableSizes } = input;
  const morphology = calculateMorphology(heightCm, weightKg);
  const isPants = /jean|pantalon|culotte|short/i.test(category);
  const isOversizeProduct = /oversize/i.test(category);

  let recommendedSize = 'M';
  let confidenceScore = 94;
  let fitExplanation = '';
  let sizeAdvice = '';
  let alternativeSize: string | undefined = undefined;
  let alternativeAdvice: string | undefined = undefined;

  if (isPants) {
    // Bottoms sizing (numeric US waist sizes: 30, 32, 34, 36, 38 or standard S, M, L, XL)
    const hasNumericSizes = availableSizes?.some((s) => /^\d{2}$/.test(s));

    if (hasNumericSizes) {
      if (weightKg < 63) recommendedSize = '30';
      else if (weightKg < 73) recommendedSize = '32';
      else if (weightKg < 84) recommendedSize = '34';
      else if (weightKg < 96) recommendedSize = '36';
      else recommendedSize = '38';

      // Fit adjustments
      if (fitPreference === 'fitted' && weightKg >= 70 && recommendedSize !== '30') {
        const sizes = ['30', '32', '34', '36', '38'];
        const idx = sizes.indexOf(recommendedSize);
        if (idx > 0) alternativeSize = sizes[idx - 1];
        alternativeAdvice = 'Pour une coupe très ajustée et fuselée aux chevilles.';
      } else if (fitPreference === 'oversize') {
        const sizes = ['30', '32', '34', '36', '38'];
        const idx = sizes.indexOf(recommendedSize);
        if (idx < sizes.length - 1) {
          alternativeSize = sizes[idx + 1];
          alternativeAdvice = 'Pour un tombé plus ample façon streetwear baggy.';
        }
      }
    } else {
      // Standard letters for shorts / trackpants
      if (weightKg < 65) recommendedSize = 'S';
      else if (weightKg < 77) recommendedSize = 'M';
      else if (weightKg < 90) recommendedSize = 'L';
      else if (weightKg < 105) recommendedSize = 'XL';
      else recommendedSize = '2XL';
    }

    fitExplanation = `Calculé pour un tour de ceinture estimé à ~${morphology.waistEstimateCm} cm.`;
    sizeAdvice = `La taille ${recommendedSize} offrira un maintien parfait à la taille avec une liberté de mouvement optimale.`;
  } else {
    // Tops sizing (T-shirts, Hoodies, Jackets, Sets)
    // Baseline logic using weight and height matrix
    if (weightKg < 64) {
      recommendedSize = heightCm > 185 ? 'M' : 'S';
    } else if (weightKg < 76) {
      recommendedSize = heightCm > 188 ? 'L' : 'M';
    } else if (weightKg < 88) {
      recommendedSize = heightCm < 172 ? 'M' : 'L';
    } else if (weightKg < 102) {
      recommendedSize = 'XL';
    } else {
      recommendedSize = '2XL';
    }

    // Apply fit preference
    const topSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
    const currentIdx = topSizes.indexOf(recommendedSize);

    if (fitPreference === 'oversize' && currentIdx < topSizes.length - 1) {
      alternativeSize = topSizes[currentIdx + 1];
      alternativeAdvice = `Prenez du ${alternativeSize} pour des épaules tombantes et un volume streetwear plus prononcé.`;
    } else if (fitPreference === 'fitted' && currentIdx > 0) {
      alternativeSize = topSizes[currentIdx - 1];
      alternativeAdvice = `Prenez du ${alternativeSize} pour souligner le torse et les bras.`;
    }

    fitExplanation = `Ajusté pour une carrure de ~${morphology.chestEstimateCm} cm de tour de buste.`;
    sizeAdvice = `La taille ${recommendedSize} vous garantit une coupe nette au niveau des épaules et une longueur idéale sur les hanches.`;
  }

  // Ensure recommended size exists in available product sizes if provided
  if (availableSizes && availableSizes.length > 0) {
    if (!availableSizes.includes(recommendedSize)) {
      // Find nearest available size
      const nearest = availableSizes[0];
      recommendedSize = nearest;
      confidenceScore = 85;
    }
  }

  return {
    recommendedSize,
    confidenceScore,
    morphology,
    fitExplanation,
    sizeAdvice,
    alternativeSize,
    alternativeAdvice,
  };
}
