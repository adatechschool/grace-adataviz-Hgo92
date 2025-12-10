import './style.css'

function requeteAPI(nameInput, valueType, valueGenre, valuePeriod, valueDistrict) {
let whereConditions = []; // Je crée un tableau qui me permet d'ajouter mes filtres dans l'URL

if (nameInput && nameInput.trim() !== "") {
  const encodedName = encodeURIComponent(nameInput.toLowerCase()); // encoreURIComponent transforme la requête au format URL
  whereConditions.push(`search(titre, "${encodedName}")`);
}

if (valueType !== 'all') {
  const encodedType = encodeURIComponent(valueType);
  whereConditions.push(`objet_1="${encodedType}"`);
}

if (valueGenre !== 'all') {
  whereConditions.push(`genre="${valueGenre}"`);
}

if (valuePeriod !== 'all') {
  whereConditions.push(`siecle="${valuePeriod}"`);
}

if (valueDistrict !== 'all') {
  whereConditions.push(`ardt=${valueDistrict}`);
}

if (whereConditions.length > 0) {
  return `&where=${whereConditions.join(' AND ')}`;
}

return '';
}

async function donneesFiltrees(nameInput, valueType, valueGenre, valuePeriod, valueDistrict) {
const limit = 100;

const whereSearch = requeteAPI(nameInput, valueType, valueGenre, valuePeriod, valueDistrict); // Je mets mes critères au bon format dans une variable
const urlAPI = `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/plaques_commemoratives/records`;

const firstResponse = await fetch(
  `${urlAPI}?limit=${limit}&offset=0${whereSearch}`
); // Voilà mon fetch filtré

const firstData = await firstResponse.json();
const totalCount = firstData.total_count;

if (totalCount <= limit) {
  return firstData.results;
}

const numRequetes = Math.ceil(totalCount / limit);
const promises = [];

for (let i = 0; i < numRequetes; i++) {
  const offset = i * limit;
  promises.push(
    fetch(`${urlAPI}?limit=${limit}&offset=${offset}${whereSearch}`)
      .then(res => res.json())
  );
}

const responses = await Promise.all(promises); // Promise.all = promesse qui contient d'autres promesses (celles dans le tableau promises) et les attend avant d'être réalisée
const dataAPI = responses.flatMap(data => data.results); // .map me rend plusieurs tableaux, .flatMap ne m'en rend qu'un

console.log(`${dataAPI.length} résultats trouvés sur ${totalCount} total`);
return dataAPI;
}

// Mon ancien fetch si jamais l'autre ne marche pas 

// async function fetchAPI() {
// const limit = 100;

// const firstResponse = await fetch(
//   `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/plaques_commemoratives/records?limit=${limit}&offset=0`
// );

// const firstData = await firstResponse.json();
// const totalCount = firstData.total_count;

// const numRequests = Math.ceil(totalCount / limit);

// const promises = [];
// for (let i = 0; i < numRequests; i++) {
//   const offset = i * limit;
//   promises.push(
//     fetch(`https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/plaques_commemoratives/records?limit=${limit}&offset=${offset}`).then(res => res.json())
//   );
// }

// const responses = await Promise.all(promises);
// const dataAPI = responses.flatMap(data => data.results)

// console.log(dataAPI);
// return dataAPI;
// }

// let data = await fetchAPI();

// Je lie dans JavaScript tous les éléments de mon bloc de recherche

let nameSearch = document.getElementById("search-input");
let typeSearch = document.getElementById("select-type");
let genreSearch = document.getElementById("select-genre");
let periodSearch = document.getElementById("select-period");
let districtSearch = document.getElementById("select-district");
let buttonSearch = document.getElementById("search-button");
let buttonReset = document.getElementById('search-button-reset');

// Je crée des fonctions pour chaque type de recherche

function searchName(index, name, data) {
  name = name.toLowerCase() 
  let titre = data[index].titre
  if (titre) {
  titre = titre.toLowerCase()
  if (name === "" || titre.includes(name)) { 
    return true
  } else { 
    return false
  } 
  } else {
    return false
  }
}

function searchType(index, type, data) {
   if (type === 'all') {
    return true
  } else if (data[index].objet_1) {
      if (data[index].objet_1 === type || data[index].objet_1.includes(type)) {
      return true
    } else {
      return false
    }; 
  } else {
    return false
  }
  }

function searchGenre(index, genre, data) {
   if (genre === 'all') {
    return true
  } else if (data[index].genre === genre) {
    return true; 
  } else if (!data[index].genre && genre === "autre") {
    return true
  } else {return false};
} 

function searchPeriod(index, period, data) {
  if (period === 'all') { 
    return true;
  } else if (data[index].siecle) {
    if (data[index].siecle.includes('-')) {
      const siecles = data[index].siecle.split('-');
      return siecles.includes(period);
    } else {
      return data[index].siecle == period;
    }
  } else {
    return false;
  }
}

function searchDistrict(index, district, data) {
  if (district === 'all') { 
    return true
  } else if (data[index].ardt == district) {
    return true
  } else {return false}
}

buttonSearch.addEventListener('click', async ()=> {
  let compteurBloc = 0;
  let compteurAffichage = 0;
  const limit_start = 21;
  const limit_increment = 21;

  let buttonPlusPlaque = document.createElement("button");
  buttonPlusPlaque.style.display = "none";
  buttonPlusPlaque.classList.add("bouton-plus-plaque");

// Je récupère les valeurs des champs de recherche 
  const nameInput = nameSearch.value;
  const valueType = typeSearch.options[typeSearch.selectedIndex].value;
  const valueGenre = genreSearch.options[genreSearch.selectedIndex].value;
  const valuePeriod = periodSearch.options[periodSearch.selectedIndex].value;
  const valueDistrict = districtSearch.options[districtSearch.selectedIndex].value;

// Je lie le bloc de mon champ de réponse et je le vide à chaque recherche

  const blocAnswer = document.getElementById('answer-block');
  const blocLoader = document.createElement("div");
  blocAnswer.innerHTML = "";
  blocLoader.innerHTML = "Chargement en cours";
  blocAnswer.appendChild(blocLoader);
  blocLoader.style.display = 'block';

  let totalPlaques = [];

try { 
  const data = await donneesFiltrees(
  nameInput, 
  valueType, 
  valueGenre, 
  valuePeriod, 
  valueDistrict
);

for (let i = 0 ; i < data.length ; i++) { 
  let titre = data[i].titre;
  let genre = data[i].genre;
  let type1 = data[i].objet_1;
  let type2 = data[i].objet_2;
  let siecle = data[i].siecle;
  let ardt = data[i].ardt;
  let adresse = data[i].adresse;
  let materiau = data[i].materiau;
  let pays = data[i].pays || "France";
  let text = data[i].retranscription;

  if (searchPeriod(i, valuePeriod, data)) {
    compteurBloc ++;

    let blocPlaque = document.createElement('div');
    let blocClou1 = document.createElement('div');
    let blocClou2 = document.createElement('div');
    let blocContent = document.createElement('div');
    let blocPrio = document.createElement('div');
    let blocHeader = document.createElement('div');
    let blocPasPrio = document.createElement('div');
    let boutonPlus = document.createElement('button');
    let boutonMoins = document.createElement('button');

    blocPlaque.classList.add('bloc-plaque');
    blocPrio.classList.add("bloc-prio");
    blocPasPrio.classList.add("bloc-pas-prio");
    blocClou1.classList.add("screw-bottom-left");
    blocClou2.classList.add("screw-bottom-right");
    boutonPlus.classList.add("bouton-plus");
    boutonMoins.classList.add("bouton-moins");
    
    let blocTitre = document.createElement('div');


    
    if (titre) {
    blocTitre.innerText = titre;
    if (titre.length > 35) {
      blocTitre.classList.add("name-long")
    } else {
      blocTitre.classList.add("name")
    } } else {
      blocTitre.innerText = "Plaque commémorative";
      blocTitre.classList.add("name")
    }

    let blocGenre;
    if (genre === "XX") {
    blocGenre = "Femme";
    } else if (genre === "YY") {
    blocGenre = "Homme";
    } else {
    blocGenre = "Groupe / Autre";
    }
    
    let blocType = document.createElement("div");

    if (blocGenre === "Homme" || blocGenre === "Groupe / Autre") {
    blocType.classList.add("type");
      switch (type1) {
        case "les Résistants" :
        type1 = "Résistant";
        break;
        case "lieux, édifices et vestiges" :
        type1 = "Lieux et vestiges";
        break;
        case "évènements et faits historiques" :
        type1 = "Evénement";
        break;
        case "les artistes (beaux-arts)" :
        type1 = "Artiste (Beaux-Arts)";
        break;
        case "les artistes (musique et danse)" :
        type1 = "Artiste (musique et danse)";
        break;
        case "les artistes (théâtre et cinéma)" :
        type1 = "Artiste (théâtre et cinéma)";
        break;
        case "les inventeurs et ingénieurs" :
        type1 = "Inventeur / Ingénieur";
        break;
        case "les éditeurs et libraires" :
        type1 = "Editeur / Libraire";
        break;
        case "les avocats, magistrats et juristes" :
        type1 = "Avocat / Magistrat / Juriste";
        break;
        case "les Morts pour la France" :
        type1 = "Mort pour la France";
        break;
        case "les politiques" :
        type1 = "Politique";
        break;
        case "les militaires" :
        type1 = "Militaire";
        break;
        case "les victimes civiles de guerre" :
        type1 = "Victimes civiles de guerre";
        break;
        case "les médecins et scientifiques" :
        type1 = "Médecin / Scientifique";
        break;
        case "les écrivains et intellectuels" :
        type1 = "Ecrivain / Intellectuel";
        break;
        case "les religieux" :
        type1 = "Religieux";
        break;
        case "les journalistes" :
        type1 = "Journaliste";
        break;
        case "les artisans et commerçants" :
        type1 = 'Artisan / Commerçant';
        break;
        case "les victimes du terrorisme" :
        type1 = 'Victimes du terrorisme';
        break;
        case "les éducateurs et pédagogues" :
        type1 = 'Educateur / Pédagogue';
        break;
        case "les chercheurs et conservateurs du patrimoine" :
        type1 = 'Chercheur / Conservateur du patrimoine';
        break;
        case "les aviateurs" :
        type1 = 'Aviateur';
        break;
        case "les victimes d'accidents et catastrophes" :
        type1 = "Victimes d'accidents et de catastrophes";
        break;
        case "les collectionneurs, mécènes et philantropes" :
        type1 = 'Collectionneur / Mécène / Philantrope';
        break;
        case "les industriels et entrepreneurs" :
        type1 = 'Industriel / Entrepreneur';
        break;
        case "les sportifs" :
        type1 = 'Sportif';
        break;
        case "les créateurs et couturiers" :
        type1 = 'Créateur / Couturier';
        break;
        default : 
        type1 = "Autre"; }
    
    if (!type2) {
      blocType.innerText = type1
    } else {
      switch (type2) {
      case "les Résistants" :
      type2 = "Résistant";
      break;
      case "lieux, édifices et vestiges" :
      type2 = "Lieux et vestiges";
      break;
      case "événements et faits historiques" :
      type2 = "Evénement";
      break;
      case "les artistes (beaux-arts)" :
      type2 = "Artiste (Beaux-Arts)";
      break;
      case "les artistes (musique et danse)" :
      type2 = "Artiste (musique et danse)";
      break;
      case "les artistes (théâtre et cinéma)" :
      type2 = "Artiste (théâtre et cinéma)";
      break;
      case "les inventeurs et ingénieurs" :
      type2 = "Inventeur / Ingénieur";
      break;
      case "les éditeurs et les libraires" :
      type2 = "Editeur / Libraire";
      break;
      case "les avocats, magistrats et juristes" :
      type2 = "Avocat / Magistrat / Juriste";
      break;
      case "les Morts pour la France" :
      type2 = "Mort pour la France";
      break;
      case "les politiques" :
      type2 = "Politique";
      break;
      case "les militaires" :
      type2 = "Militaire";
      break;
      case "les victimes civiles de guerre" :
      type2 = "Victimes civiles de guerre";
      break;
      case "les médecins et scientifiques" :
      type2 = "Médecin / Scientifique";
      break;
      case "les écrivains et intellectuels" :
      type2 = "Ecrivain / Intellectuel";
      break;
      case "les religieux" :
      type2 = "Religieux";
      break;
      case "les journalistes" :
      type2 = "Journaliste";
      break;
      case "les artisans et commerçants" :
      type2 = 'Artisan / Commerçant';
      break; 
      case "les victimes du terrorisme" :
      type2 = 'Victimes du terrorisme';
      break;
      case "les éducateurs et pédagogues" :
      type2 = 'Educateur / Pédagogue';
      break;
      case "les chercheurs et conservateurs du patrimoine" :
      type2 = 'Chercheur / Conservateur du patrimoine';
      break;
      case "les aviateurs" :
      type2 = 'Aviateur';
      break;
      case "les victimes d'accidents et catastrophes" :
      type2 = "Victimes d'accidents et de catastrophes";
      break;
      case "les collectionneurs, mécènes et philantropes" :
      type2 = 'Collectionneur / Mécène / Philantrope';
      break;
      case "les industriels et entrepreneurs" :
      type2 = 'Industriel / Entrepreneur';
      break;
      case "les sportifs" :
      type2 = 'Sportif';
      break;
      case "les créateurs et couturiers" :
      type2 = 'Créateur / Couturier';
      break;
      default :
      type2 = "Autre"}
      blocType.innerText = type1 + " / " + type2
    } 
  } else if (blocGenre === "Femme") {
    blocType.classList.add("type");
      switch (type1) {
        case "les Résistants" :
        type1 = "Résistante";
        break;
        case "lieux, édifices et vestiges" :
        type1 = "Lieux et vestiges";
        break;
        case "évènements et faits historiques" :
        type1 = "Evénement";
        break;
        case "les artistes (beaux-arts)" :
        type1 = "Artiste (Beaux-Arts)";
        break;
        case "les artistes (musique et danse)" :
        type1 = "Artiste (musique et danse)";
        break;
        case "les artistes (théâtre et cinéma)" :
        type1 = "Artiste (théâtre et cinéma)";
        break;
        case "les inventeurs et ingénieurs" :
        type1 = "Inventeuse / Ingénieure";
        break;
        case "les éditeurs et libraires" :
        type1 = "Editrice / Libraire";
        break;
        case "les avocats, magistrats et juristes" :
        type1 = "Avocate / Magistrate / Juriste";
        break;
        case "les Morts pour la France" :
        type1 = "Morte pour la France";
        break;
        case "les politiques" :
        type1 = "Politique";
        break;
        case "les militaires" :
        type1 = "Militaire";
        break;
        case "les victimes civiles de guerre" :
        type1 = "Victimes civiles de guerre";
        break;
        case "les médecins et scientifiques" :
        type1 = "Médecin / Scientifique";
        break;
        case "les écrivains et intellectuels" :
        type1 = "Ecrivain / Intellectuelle";
        break;
        case "les religieux" :
        type1 = "Religieuse";
        break;
        case "les journalistes" :
        type1 = "Journaliste";
        break;
        case "les artisans et commerçants" :
        type1 = 'Artisan / Commerçante';
        break;
        case "les victimes du terrorisme" :
        type1 = 'Victimes du terrorisme';
        break;
        case "les éducateurs et pédagogues" :
        type1 = 'Educatrice / Pédagogue';
        break;
        case "les chercheurs et conservateurs du patrimoine" :
        type1 = 'Chercheuse / Conservatrice du patrimoine';
        break;
        case "les aviateurs" :
        type1 = 'Aviatrice';
        break;
        case "les victimes d'accidents et catastrophes" :
        type1 = "Victimes d'accidents et de catastrophes";
        break;
        case "les collectionneurs, mécènes et philantropes" :
        type1 = 'Collectionneuse / Mécène / Philantrope';
        break;
        case "les industriels et entrepreneurs" :
        type1 = 'Industrielle / Entrepreneure';
        break;
        case "les sportifs" :
        type1 = 'Sportive';
        break;
        case "les créateurs et couturiers" :
        type1 = 'Créatrice / Couturière';
        break;
        default : 
        type1 = "Autre"; }
    
    if (!type2) {
      blocType.innerText = type1
    } else {
      switch (type2) {
      case "les Résistants" :
      type2 = "Résistante";
      break;
      case "lieux, édifices et vestiges" :
      type2 = "Lieux et vestiges";
      break;
      case "événements et faits historiques" :
      type2 = "Evénement";
      break;
      case "les artistes (beaux-arts)" :
      type2 = "Artiste (Beaux-Arts)";
      break;
      case "les artistes (musique et danse)" :
      type2 = "Artiste (musique et danse)";
      break;
      case "les artistes (théâtre et cinéma)" :
      type2 = "Artiste (théâtre et cinéma)";
      break;
      case "les inventeurs et ingénieurs" :
      type2 = "Inventeuse / Ingénieure";
      break;
      case "les éditeurs et les libraires" :
      type2 = "Editrice / Libraire";
      break;
      case "les avocats, magistrats et juristes" :
      type2 = "Avocate / Magistrate / Juriste";
      break;
      case "les Morts pour la France" :
      type2 = "Morts pour la France";
      break;
      case "les politiques" :
      type2 = "Politique";
      break;
      case "les militaires" :
      type2 = "Militaire";
      break;
      case "les victimes civiles de guerre" :
      type2 = "Victimes civiles de guerre";
      break;
      case "les médecins et scientifiques" :
      type2 = "Médecin / Scientifique";
      break;
      case "les écrivains et intellectuels" :
      type2 = "Ecrivain / Intellectuelle";
      break;
      case "les religieux" :
      type2 = "Religieuse";
      break;
      case "les journalistes" :
      type2 = "Journaliste";
      break;
      case "les artisans et commerçants" :
      type2 = 'Artisan / Commerçante';
      break; 
      case "les victimes du terrorisme" :
      type2 = 'Victimes du terrorisme';
      break;
      case "les éducateurs et pédagogues" :
      type2 = 'Educatrice / Pédagogue';
      break;
      case "les chercheurs et conservateurs du patrimoine" :
      type2 = 'Chercheuse / Conservatrice du patrimoine';
      break;
      case "les aviateurs" :
      type2 = 'Aviatrice';
      break;
      case "les victimes d'accidents et catastrophes" :
      type2 = "Victimes d'accidents et de catastrophes";
      break;
      case "les collectionneurs, mécènes et philantropes" :
      type2 = 'Collectionneuse / Mécène / Philantrope';
      break;
      case "les industriels et entrepreneurs" :
      type2 = 'Industrielle / Entrepreneure';
      break;
      case "les sportifs" :
      type2 = 'Sportive';
      break;
      case "les créateurs et couturiers" :
      type2 = 'Créatrice / Couturière';
      break;
      default :
      type2 = "Autre"}
      blocType.innerText = type1 + " / " + type2
    } }  
    
    let blocSiecle
    if (siecle) {
      blocSiecle = siecle + "e siècle";
    } else {
      blocSiecle = " ";
    }
    
    
    let blocMateriau;
    if (materiau) {
    switch (materiau) {
      case "pierre" :
      blocPlaque.classList.add("pierre");
      break;
      case "pierre blanche" :
      blocPlaque.classList.add("pierre-blanche");
      break;
      case "marbre blanc" : 
      blocPlaque.classList.add("marbre-blanc");
      break;
      case "marbre noir": 
      blocPlaque.classList.add("marbre-noir");
      break;
      case "marbre": 
      blocPlaque.classList.add("marbre");
      break;
      case "granit": 
      blocPlaque.classList.add("granit");
      break;
      case "comblanchien": 
      blocPlaque.classList.add("comblanchien");
      break;
      case "plexiglas": 
      blocPlaque.classList.add("plexiglas");
      break;
      default : 
      blocPlaque.classList.add("autre");
    }
    materiau = materiau.charAt(0).toUpperCase() + materiau.slice(1);
    blocMateriau = materiau;
    } else {
      blocMateriau = "Materiau inconnu"
      blocPlaque.classList.add("autre")
    };

    let blocData = document.createElement('div');
    blocData.classList.add("metadata");
    blocData.innerHTML = `<span>${blocSiecle}</span>
                    <span>•</span>
                    <span>${blocGenre}</span>
                    <span>•</span>
                    <span>${pays}</span>
                    <span>•</span>
                    <span>${blocMateriau}</span>`
    
    let blocAdresse = document.createElement('div');
    blocAdresse.classList.add("address");
    blocAdresse.innerText = adresse + " • " + ardt + "e arrondissement"; 
    
    let blocText = document.createElement('div');
    blocText.classList.add("description");
    const regex = /[/|]/g;
    text = text.split(regex).join(" ");
    blocText.innerText = text;

  blocAnswer.appendChild(blocPlaque);
  blocPlaque.appendChild(blocContent);
  blocPlaque.appendChild(blocClou1);
  blocPlaque.appendChild(blocClou2);
  blocPlaque.classList.add("bloc-plaque")

  blocContent.appendChild(blocPrio)
  blocContent.appendChild(blocPasPrio);
  blocContent.classList.add("bloc-content");

  blocPrio.appendChild(blocHeader);
  blocHeader.appendChild(blocAdresse);
  blocHeader.appendChild(blocData);
  blocHeader.classList.add("bloc-header");

  blocPrio.appendChild(blocTitre);
  blocPrio.appendChild(blocType);
  blocPrio.appendChild(boutonPlus);
  blocPasPrio.appendChild(blocText);
  blocPasPrio.appendChild(boutonMoins);

  blocPasPrio.style.display = "none";
  boutonPlus.innerText = "Voir plus";
  boutonPlus.addEventListener("click", () => {
    blocPasPrio.style.display = "block";
    boutonPlus.style.display = "none";
  });

  boutonMoins.innerText = "Voir moins";
  boutonMoins.addEventListener("click", () => {
    blocPasPrio.style.display = "none";
    boutonPlus.style.display = "block";
  });

  totalPlaques.push(blocPlaque);

  if (compteurBloc > limit_start) {
    blocPlaque.style.display="none";
  }
  }
}

if (compteurBloc > limit_start) {
  blocAnswer.appendChild(buttonPlusPlaque);
  buttonPlusPlaque.style.display="block";
  buttonPlusPlaque.innerText = `Voir plus de plaques (${compteurBloc} au total)`;

  buttonPlusPlaque.addEventListener("click", () => {
    let debut = compteurAffichage + limit_start;
    let fin = Math.min(debut + limit_increment, totalPlaques.length);

    for (let i = debut; i < fin; i++) {
      totalPlaques[i].style.display = "block"
    }
    compteurAffichage += limit_increment;

    if (fin >= totalPlaques.length) {
      buttonPlusPlaque.style.display = "none";
    } else {
      let restantes = totalPlaques.length - fin;
      buttonPlusPlaque.innerText = `Voir plus de plaques (${restantes} restantes)`
    }
  });
}

  blocLoader.style.display = "none";

  if (compteurBloc === 0) {
    blocAnswer.innerHTML = "<p style='text-align:center; width:100%; margin:20px; font-size:1.2rem;'>Aucune plaque trouvée avec ces critères.</p>";
  }

  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    blocAnswer.innerHTML = "<p style='text-align:center; color:red; width:100%; margin:20px;'>Erreur lors du chargement des données. Veuillez réessayer.</p>";
  }
}) 

buttonReset.addEventListener("click", () => {
  nameSearch.value = "";
  typeSearch.selectedIndex = 0;
  genreSearch.selectedIndex = 0;
  periodSearch.selectedIndex = 0;
  districtSearch.selectedIndex = 0;

  document.getElementById('answer-block').innerHTML = "";
})

const buttonFont = document.getElementById("button-font");
buttonFont.addEventListener("click", () => {
  if (document.body.style.fontFamily === "DidotFont") {
    document.body.style.fontFamily = "Atkinson";
  } else {
    document.body.style.fontFamily = "DidotFont";
  };
});


