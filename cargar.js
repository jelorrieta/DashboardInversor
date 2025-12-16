// --- Cargar datos ---

let rawData = [];
let ppvpcwChart = null;
let selectedValue = 100;  // Valor predeterminado

async function setSelectedValue(value) {
  selectedValue = value;
  console.log('Valor seleccionado:', selectedValue);
  update();
}

async function cargarDatos() {
  try {
    const resp = await fetch("https://datosinversor-apfaa2aadgcwcvey.brazilsouth-01.azurewebsites.net/api/dashboard?tz=-3");
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error("Error cargando datos:", e);
    return [];
  }
}

async function init(){
  update();
  setInterval(update, 25000);
}
async function update() {

  console.log('Valor seleccionado:', selectedValue);
  rawData = await cargarDatos();

  // Si no hay datos, evitamos errores
  if (!rawData.series.length) {
    console.warn("Sin datos disponibles");
    return;
  }

  // Ordenar y obtener el último
  const sorted = rawData.series.slice().sort(
    (a, b) => new Date(a.ts) - new Date(b.ts)
  );

  const latest = rawData.current;
  const series = rawData.series;

  anchoPantalla = window.innerWidth;
  console.log(anchoPantalla);

  // fill header meta
    document.getElementById('lastMeta').textContent = `Último registro: ${latest.FECHA} ${latest.HORA}`;
    document.getElementById('nowMeta').textContent = `Registros: ${series.length}`;
    document.getElementById('win-width').textContent = `Ancho de Pantalla: ${anchoPantalla} px`;

    // KPIs
    document.getElementById('vpv').textContent = latest.VPV + ' V';
    document.getElementById('ppv').textContent = latest.PPV + 'W';
    document.getElementById('pcw').textContent = latest.PCW + 'W';

    // small stats
    document.getElementById('vbt').textContent = latest.VBT + 'V';
    document.getElementById('ibc').textContent = latest.IBC + ' A';
    document.getElementById('ibt').textContent = latest.IBT + ' A';
	document.getElementById('pbt').textContent = latest.PBAT;
    document.getElementById('ewh').textContent = latest.EW + 'Wh';
    document.getElementById('contador').textContent = latest.CHR;

    document.getElementById('cp').textContent = latest.CP || '-';
    document.getElementById('sp').textContent = latest.SP || '-';
    document.getElementById('st').textContent = latest.ST || '-';

    // raw JSON
    //document.getElementById('raw').textContent = JSON.stringify(sorted.slice(-20).reverse(), null, 2);

    // prepare arrays for charts (time ascending)
    const times = sorted.map(r=> r.h || r.timestamp);
    const ppv = sorted.map(r=> r.p || 0);
    const pcw = sorted.map(r=> r.c|| 0);
    const carga = sorted.map(r=> Math.max(Math.min(r.b|| 0,1),0));

    // --- PPV vs PCW ---

    const ctxPPV = document.getElementById('ppvpcwChart').getContext('2d');
        
    if(!ppvpcwChart){
      //console.log(pcw);  
      ppvpcwChart = new Chart(ctxPPV,{
        type:'line',
        data:{
          labels:
          times,datasets:[
            {label:'Paneles',data:ppv,borderColor:'green',pointBackgroundColor:'green',tension:0.25,pointRadius:1,borderWidth:1.5,yAxisID:'y1'},
            {label:'Cargas',data:pcw,borderColor:'blue',pointBackgroundColor:'blue',tension:0.25,pointRadius:1,borderWidth:1.5,yAxisID:'y1'},
            {
				label:'% Batería',
			 	data:carga,borderColor:'yellow',
				pointBackgroundColor:'yellow',
				tension:0.25,
				pointRadius:1,
				borderWidth:1.5,
				yAxisID:'y2'
			}
          ]
        },
        options:{
          animation:false,
          interaction:{mode:'index',intersect:false},
          scales:{
            x: {
              //type: 'time',
              //time: { unit: 'minute' },
              min: times[times.length - selectedValue],   // hace visible solo los últimos 50 registros
              max: times[times.length - 1],
							ticks: {color: '#dddddd'}
            },
            y1:{type:'linear',position:'left',title:{display:false,text:'Potencia (W)'},ticks: {color: '#dddddd'}},
            y2:{
              beginAtZero: false,
              suggestedMin: function(context) {
                const minValue = Math.min(...context.chart.data.datasets[2].data);
                return minValue - Math.abs(minValue * 0.15);
              },
              suggestedMax: function(context) {
                const maxValue = Math.max(...context.chart.data.datasets[2].data);
                return Math.min(maxValue + Math.abs(maxValue * 0.1),1);
              },

              type:'linear',
              position:'right',
              grid:{
                drawOnChartArea:false
              },
              title:{
                display:false,
                text:'% Batería'
              },
              ticks: {
                color: '#dddddd',
				callback: value => Math.round(value * 100) + '%'
			  }
            }
          },
          responsive:true,
          maintainAspectRatio:false,
          plugins:{
            zoom: {
              pan: {
                enabled: true,
                mode: 'x',
                modifierKey: 'ctrl',   // mover solo eje X
                threshold: 10
              },
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: 'x'  // Permite zoom en ambos ejes
              }
    
            },
			  
			tooltip: {
    		callbacks: {
      			label: (ctx) => {
        			if (ctx.dataset.yAxisID === 'y2') {
          				return `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%`;
        			}
        			return `${ctx.dataset.label}: ${ctx.raw}`;
      			}
    		}
 			},
			  
            legend:{
              position:'bottom',
              usePointStyle: true,
              pointStyle: "line",
							labels: {color: '#dddddd'}
            }
          }
        },
      
      });
    }else {
      ppvpcwChart.data.labels = times;
      ppvpcwChart.data.datasets[0].data = ppv;
      ppvpcwChart.data.datasets[1].data = pcw;
      if(selectedValue<times.length){
        ppvpcwChart.options.scales.x.min = times[times.length - selectedValue];
      } else{
        ppvpcwChart.options.scales.x.min = times[0];
      }
      console.log(selectedValue);
      ppvpcwChart.options.scales.x.max = times[times.length - 1];
      ppvpcwChart.update();
    }
}
init();





