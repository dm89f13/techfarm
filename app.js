// https://api.openweathermap.org/data/2.5/onecall?lat=12.953190399999999&lon=77.5749632&appid=17182924a2d647e70bdd30a6b72cc3ac&units=metric

// http://openweathermap.org/img/wn/01d@2x.png

const WEA_URL = "https://api.openweathermap.org/data/2.5/onecall?"
const IMG_URL = "http://openweathermap.org/img/wn/"
const A_KEY = '17182924a2d647e70bdd30a6b72cc3ac';

let lat = '51.50722';
let lng = '-0.1275';


const sDropdown = document.getElementById('select-state'); //state dropdown
const selectCom = document.getElementById('select-com');    //commodity drop down


initComLoad(); // initialize commodity container



const getLocation = document.getElementById(`get-my-location`); //button

updateWeather(lat, lng);


getLocation.addEventListener('click', geoFindMe);


function geoFindMe() {

  
    async function success(position) {
      const latitude  = position.coords.latitude;
      const longitude = position.coords.longitude;

        await updateWeather( latitude, longitude );


    }
  
    function error() {
      status.textContent = 'Unable to retrieve your location';
    }
  
    if(!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
    } else {
      navigator.geolocation.getCurrentPosition(success, error);
    }
  
}


async function updateWeather( latitude, longitude ){

    let res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&appid=${A_KEY}&units=metric`)
    // let res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=12.953190399999999&lon=77.5749632&appid=17182924a2d647e70bdd30a6b72cc3ac&units=metric`)
    
    if(res.status !== 200){
        alert(`API DOWN  Error Code ${ res.status } Try agin later `)
        throw new Error(' API DOWN msg from update weather function');
    }

    let data = await res.json();
    // console.log(data);

    updateWcards( data );

    res = await fetch( `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=${A_KEY}` )

        
    if(res.status !== 200){
        throw new Error(' API DOWN msg from update weather function');
    }

    let cityData = await res.json();
    updateTime(data, cityData);
    updateNews(data);
    
    //weather card update
    function updateWcards(data){

    const slider = document.getElementById('slider');
    deleteChildNodes(slider);
    
    const daysWdata = data.daily;

    for( let dayData of daysWdata ){

        let wCard = document.createElement('div');

        wCard.style.backgroundColor = '#eae4e9'
        wCard.classList.add( 'card' );
        wCard.classList.add( 'w-card' );
        wCard.classList.add( 'd-inline-block' );

        let date = new Date(dayData.dt*1000);

        wCard.innerHTML = `
                <div class="card-body py-1">
                <div class="row mb-4">
                    <div class="col-6">
                        <img id="w-icon"class="img-fluid"  src="${IMG_URL}${dayData.weather[0].icon}@4x.png" alt="">
                    </div>
                    <div class="col-6">
                        <div class="card-text h5">${date.toUTCString()}</div>
                    </div>
                </div>
                <div   class="row ">
                    <ul class="list-group px-1">
                        <li class="list-group-item"   style="background-color: #f0efeb;" ><span class="h6">Description:  </span>${ dayData.weather[0].description }</li> 
                        <li class="list-group-item "  style="background-color: #f0efeb;" ><span class="h6">Min Temp:  </span>${dayData.temp.min} &#176;  C</li>
                        <li class="list-group-item "  style="background-color: #f0efeb;" ><span class="h6">Max Temp:  </span> ${dayData.temp.max} &#176;  C</li>
                        <li class="list-group-item "  style="background-color: #f0efeb;" ><span class="h6">Wind Speed:  </span>${dayData.wind_speed} m/s</li>
                        <li class="list-group-item "  style="background-color: #f0efeb;" ><span  class="h6">Precipitation:  </span> ${Math.round(dayData.pop*100)} %</li>

                    </ul>
                </div>
            </div>


        `

        slider.appendChild(wCard);



    }



    }


    //location time  city name updater
    function updateTime( data , cityData){
        
        
        let locationInfo = document.getElementById( 'location-info' );
        let date = new Date(data.current.dt*1000);
        locationInfo.innerHTML = `

        <li id = "time" class="list-group-item">Time : ${ date.toLocaleTimeString() }  </li>
        <li id = "lat" class="list-group-item ">Lat : ${data.lat} </li>
        <li id = "lng"  class="list-group-item">Long : ${data.lon}</li>
        <li id = "city" class="list-group-item">City name : ${cityData[0].name}  </li>

        `
        


    }


    function updateNews( data ){


        let news = document.getElementById( 'w-alert' );
        // console.log( data.alerts[0].sender_name )
        news.innerHTML = `${data.alerts[0].description } <small class ="text-muted" > <br>  -  ${ data.alerts[0].sender_name } </small  >  `;
        

    }


    
}

function deleteChildNodes(parent){

    while(parent.firstChild){

        parent.removeChild(parent.lastChild);

    }

}




// this is commodity price updater


sDropdown.addEventListener( 'change', async (evt)=>{

    const sState = evt.target.value;
    await loadCommo(sState);
    await loadComPrice();
})

selectCom.addEventListener( 'change', async(evt)=>{

    selectCom.value =evt.target.value;
    await loadComPrice();

} )


async function initComLoad(){

    await updateStates();
    await loadCommo(sDropdown.value);
    await loadComPrice();

}


async function updateStates(){


    deleteChildNodes(sDropdown);

    const comData = await getComData();

    const states = new Set();

    for( let sData of comData ){
        states.add(sData.state);
    }

    for( let state of states ){
        
        let option = document.createElement('option');
        option.innerText = state;
        option.value = state;
        sDropdown.appendChild(option);
    }
    



}

async function loadComPrice(){ //actual price table

    const priceTable = document.getElementById("com-price-body");
    deleteChildNodes(priceTable);

    const comData = await getComData();

    let state = sDropdown.value;
    let commo = selectCom.value;
    console.log(state);

    let comCnt = 1;
    for(let aState of comData ){

        if( aState.state === state && aState.commodity === commo ){

            let tr = document.createElement('tr');
            tr.innerHTML = `
            <th scope="col">${comCnt}</th>
            <td> ${aState.market}</td>
            <td> ${aState.district} </td>
            <td> ${aState.commodity} </td>
            <td> ${aState.variety} </td>
            <td> ${aState.min_price} </td>
            <td> ${aState.max_price} </td>
            <td> ${aState.modal_price} </td>
            `
            comCnt += 1;
            priceTable.appendChild(tr);

        }


    }



}

async function loadCommo(state){

    const comData = await getComData();

    deleteChildNodes(selectCom);

    for( let aState of comData ){

        if( aState.state === state ){

            let option = document.createElement( 'option' );
            option.value = aState.commodity;
            option.innerText = aState.commodity;
            selectCom.appendChild(option);

        }
    
    }


}


async function getComData(){

    let data = JSON.parse(comoData);

    return data;

}

function deleteChildNodes(pNode){

    while(pNode.firstChild){
        pNode.removeChild(pNode.lastChild);
    }

}

