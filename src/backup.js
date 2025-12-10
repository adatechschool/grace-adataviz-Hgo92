// Fonctions que j'avais mises dans mon code mais finalement enlevées (quand j'ai changé le fetch)

async function fetchAPI() {
const limit = 100;

const firstResponse = await fetch(
  `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/plaques_commemoratives/records?limit=${limit}&offset=0`
);

const firstData = await firstResponse.json();
const totalCount = firstData.total_count;

const numRequests = Math.ceil(totalCount / limit);

const promises = [];
for (let i = 0; i < numRequests; i++) {
  const offset = i * limit;
  promises.push(
    fetch(`https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/plaques_commemoratives/records?limit=${limit}&offset=${offset}`).then(res => res.json())
  );
}

const responses = await Promise.all(promises);
const dataAPI = responses.flatMap(data => data.results)

console.log(dataAPI);
return dataAPI;
}

let data = await fetchAPI();

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

function searchDistrict(index, district, data) {
  if (district === 'all') { 
    return true
  } else if (data[index].ardt == district) {
    return true
  } else {return false}
}