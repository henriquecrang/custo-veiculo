(function(root,factory){
 const api=factory();
 if(typeof module==='object' && module.exports) module.exports=api;
 root.CustoVeiculoCharts=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
 const format=x=>brl.format(x);
 function makeBars(results,names){
   if(!Array.isArray(results) || !results.length) return '';
   const values=results.map(x=>x.economic.equivalentCost);
   const min=Math.min(0,...values),max=Math.max(0,...values);
   const span=Math.max(1,max-min);
   const zero=100*(0-min)/span;
   return '<div class="chart-bars" role="img" aria-label="Custo econômico total de cada estratégia, em reais, equivalente ao final do período">'+
     results.map((x,i)=>{
       const val=values[i],start=100*(Math.min(val,0)-min)/span,width=Math.max(val===0?0:0.25,100*Math.abs(val)/span);
       const bar='<span class="chart-bar '+(val<0?'negative':'')+'" style="left:'+start.toFixed(4)+'%;width:'+width.toFixed(4)+'%"></span>';
       return '<div class="chart-bar-row"><span class="chart-bar-label">'+escape(names[x.id]||x.id)+'</span><div class="chart-bar-track" aria-hidden="true"><span class="chart-zero" style="left:'+zero.toFixed(4)+'%"></span>'+bar+'</div><strong>'+escape(format(val))+'</strong></div>';
     }).join('')+'</div>';
 }
 function timelineSeries(scenario){
   if(!scenario || !scenario.economic || !Array.isArray(scenario.economic.timeline)) return [];
   let cumulative=0;
   return scenario.economic.timeline.map(row=>{
     cumulative+=row.equivalentCost;
     return {month:row.month,nominalCost:-row.cumulativeCashFlow,equivalentContributions:cumulative};
   });
 }
 function makeTimeline(scenario){
   const data=timelineSeries(scenario);
   if(data.length<2)return '';
   const W=640,H=264,left=78,right=18,top=17,bottom=45;
   const w=W-left-right,h=H-top-bottom;
   const values=data.flatMap(x=>[x.nominalCost,x.equivalentContributions,0]);
   let min=Math.min(...values),max=Math.max(...values);
   if(max-min<1){max+=1;min-=1}
   const pad=(max-min)*.08;min-=pad;max+=pad;
   const xScale=x=>left+w*x/Math.max(1,data.at(-1).month);
   const yScale=y=>top+h*(max-y)/(max-min);
   const line=key=>data.map((r,i)=>(i?'L':'M')+xScale(r.month).toFixed(2)+' '+yScale(r[key]).toFixed(2)).join(' ');
   const ticks=[0,.5,1].map(t=>{
     const y=top+t*h,v=max-t*(max-min);
     return '<line x1="'+left+'" x2="'+(W-right)+'" y1="'+y+'" y2="'+y+'" class="chart-gridline"/>'+
       '<text x="'+(left-9)+'" y="'+(y+4)+'" class="chart-tick" text-anchor="end">'+escape(format(v))+'</text>';
   }).join('');
   const xTicks=[0,Math.floor(data.at(-1).month/2),data.at(-1).month].filter((x,i,a)=>a.indexOf(x)===i).map(m=>
     '<text x="'+xScale(m)+'" y="'+(H-16)+'" class="chart-tick" text-anchor="middle">'+m+' meses</text>').join('');
   const desc='Evolução do custo nominal líquido acumulado e da contribuição acumulada ao custo econômico equivalente final, mês a mês. O valor equivalente final é calculado com todas as entradas e saídas, inclusive revenda e quitação.';
   return '<svg class="trend-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+escape(desc)+'">'+
     '<title>Fluxos acumulados até cada mês</title><desc>'+escape(desc)+'</desc>'+ticks+
     '<path d="'+line('nominalCost')+'" class="chart-line nominal"/>'+
     '<path d="'+line('equivalentContributions')+'" class="chart-line equivalent"/>'+
     xTicks+'</svg>';
 }
 return {makeBars,timelineSeries,makeTimeline};
});