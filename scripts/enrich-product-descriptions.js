const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v) acc[k.trim()] = v.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DESCRIPTIONS_UPDATE = {
  'T Shirt': `<p><strong>T-shirt Basique Urban KAKOS</strong> — L'essentiel absolu du dressing streetwear. Confectionné dans un coton doux et respirant avec une coupe droite confortable idéale pour le climat tropical.</p>
<ul>
  <li><strong>Matière :</strong> 100% Coton peigné respirant</li>
  <li><strong>Col :</strong> Col rond à bord-côte renforcé</li>
  <li><strong>Coupe :</strong> Regular fit polyvalente</li>
</ul>`,

  'Tshirt': `<p><strong>T-shirt Graphic & Pull KAKOS Urban Edition</strong> — Une collection vibrante alliant confort quotidien et design streetwear percutant. Parfait pour vos sorties décontractées et tenues urbaines tendance.</p>
<ul>
  <li><strong>Matière :</strong> Coton lourd de qualité supérieure</li>
  <li><strong>Finitions :</strong> Sérigraphie haute définition résistante aux lavages</li>
  <li><strong>Coupe :</strong> Boxy / Streetwear décontractée</li>
</ul>`,

  'Salopettes Hommes': `<p><strong>Salopette Streetwear Cargo KAKOS</strong> — Une silhouette utilitaire forte et tendance. Dotée de multiples poches cargo et de bretelles ajustables en métal brossé, cette salopette apporte un style vintage-workwear inimitable.</p>
<ul>
  <li><strong>Matière :</strong> Toile denim robuste et confortable</li>
  <li><strong>Détails :</strong> Poches plaquées poitrine et poches cargo latérales</li>
  <li><strong>Coupe :</strong> Ample et structurée</li>
</ul>`,

  'Doudoune Balenciaga': `<p><strong>Doudoune Matelassée KAKOS Streetwear</strong> — Veste matelassée oversize au volume affirmé. Conçue pour offrir une allure résolument mode avec son col montant protecteur et sa fermeture zippée intégrale renforcée.</p>
<ul>
  <li><strong>Matière :</strong> Tissu technique déperlant et doublure thermique légère</li>
  <li><strong>Fermeture :</strong> Zip métallique robuste et cordon d'ajustement</li>
  <li><strong>Coupe :</strong> Oversized bouffante contemporaine</li>
</ul>`,

  'Culottes': `<p><strong>Short Culotte Streetwear KAKOS</strong> — Short décontracté à la coupe ample inspirée de la mode urbaine. Doté d'une taille élastique avec cordon de serrage pour un maintien et une liberté de mouvement absolus.</p>
<ul>
  <li><strong>Matière :</strong> Molleton de coton respirant</li>
  <li><strong>Poches :</strong> Deux poches latérales profondes</li>
  <li><strong>Taille :</strong> Cordon de serrage réglable</li>
</ul>`
};

async function run() {
  console.log('Enriching product descriptions...');
  for (const [title, desc] of Object.entries(DESCRIPTIONS_UPDATE)) {
    const { data, error } = await supabase
      .from('products')
      .update({ description: desc })
      .ilike('title', title)
      .select('id, title');

    if (error) {
      console.error(`Error updating "${title}":`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Updated description for "${title}" (${data.length} matched)`);
    } else {
      console.log(`⚠️ No match found for "${title}"`);
    }
  }
  console.log('Done!');
}

run();
