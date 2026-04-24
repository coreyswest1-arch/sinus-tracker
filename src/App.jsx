import { useState, useEffect } from 'react'

const BACKEND_URL = 'REPLACE_WITH_CLOUD_RUN_URL'

const flareFactors = ['Poor sleep','Mouth breathing','Dry air','Stress','Missed practice','Exercise','Diet','Weather change','Alcohol','Screen time']

function getPainColor(r){if(r<=2)return'#4ade80';if(r<=4)return'#a3e635';if(r<=6)return'#facc15';if(r<=8)return'#fb923c';return'#f87171'}

function getPainLabel(r){if(r===0)return'None';if(r<=2)return'Minimal';if(r<=4)return'Mild';if(r<=6)return'Moderate';if(r<=8)return'Significant';return'Severe'}

function formatDate(iso){return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}

function formatTime(iso){return new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}

export default function App() {

  const [logs,setLogs]=useState([])

  const [loading,setLoading]=useState(true)

  const [view,setView]=useState('log')

  const [saving,setSaving]=useState(false)

  const [saved,setSaved]=useState(false)

  const [error,setError]=useState(null)

  const [form,setForm]=useState({pain:3,cp:'',steps:'',practiced:false,taped:false,factors:[],notes:''})

  useEffect(()=>{loadLogs()},[])

  async function loadLogs(){

    setLoading(true);setError(null)

    try{

      const res=await fetch(`${BACKEND_URL}/load`)

      const data=await res.json()

      setLogs((data.logs||[]).reverse())

    }catch(e){setError('Could not load from server.')}

    finally{setLoading(false)}

  }

  async function submitLog(){

    setSaving(true);setError(null)

    const entry={id:Date.now(),timestamp:new Date().toISOString(),pain:form.pain,cp:form.cp?Number(form.cp):null,steps:form.steps?Number(form.steps):null,practiced:form.practiced,taped:form.taped,factors:form.factors,notes:form.notes}

    try{

      const res=await fetch(`${BACKEND_URL}/save`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entry})})

      const data=await res.json()

      if(data.status!=='ok')throw new Error()

      setLogs(prev=>[entry,...prev])

      setForm({pain:3,cp:'',steps:'',practiced:false,taped:false,factors:[],notes:''})

      setSaved(true);setTimeout(()=>setSaved(false),2500)

      setView('history')

    }catch(e){setError('Could not save to server.')}

    finally{setSaving(false)}

  }

  function toggleFactor(f){setForm(p=>({...p,factors:p.factors.includes(f)?p.factors.filter(x=>x!==f):[...p.factors,f]}))}

  const lastCP=logs.find(l=>l.cp)?.cp??null

  const lastSteps=logs.find(l=>l.steps)?.steps??null

  const avgPain=logs.length?(logs.reduce((s,l)=>s+Number(l.pain),0)/logs.length).toFixed(1):null

  const practiceDays=logs.filter(l=>l.practiced===true||l.practiced==='true').length

  const tapeDays=logs.filter(l=>l.taped===true||l.taped==='true').length

  const topFactors=(()=>{const c={};logs.forEach(l=>(l.factors||[]).forEach(f=>{c[f]=(c[f]||0)+1}));return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,3)})()

  const card={background:'#0d1b2a',border:'1px solid #1e3a5f',borderRadius:12,padding:'20px'}

  const lbl={fontSize:12,letterSpacing:2,color:'#546e8a',textTransform:'uppercase',fontFamily:'monospace',marginBottom:14,display:'block'}

  return(

    <div style={{minHeight:'100vh',background:'#0a0f1a',color:'#e8eaf0',fontFamily:'Georgia,serif',paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#0d1b2a,#1a2744)',borderBottom:'1px solid #1e3a5f',padding:'28px 24px 20px'}}>

        <div style={{maxWidth:480,margin:'0 auto'}}>

          <div style={{display:'flex',gap:10,marginBottom:4}}>

            <span style={{fontSize:11,letterSpacing:4,color:'#4a9eff',textTransform:'uppercase',fontFamily:'monospace'}}>SINUS</span>

            <span style={{fontSize:11,letterSpacing:4,color:'#546e8a',textTransform:'uppercase',fontFamily:'monospace'}}>& BUTEYKO</span>

          </div>

          <h1 style={{fontSize:26,fontWeight:400,margin:'0 0 4px',color:'#c8d8f0',letterSpacing:-0.5}}>Recovery Tracker</h1>

          <div style={{fontSize:10,color:'#3a5272',fontFamily:'monospace',marginBottom:16,display:'flex',alignItems:'center',gap:6}}>

            <span style={{width:6,height:6,borderRadius:'50%',background:error?'#f87171':'#4ade80',display:'inline-block'}}/>

            {error?'Server error':loading?'Connecting...':'Connected'}

          </div>

          {error&&<div style={{background:'rgba(248,113,113,0.1)',border:'1px solid #f87171',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:11,color:'#f87171',fontFamily:'monospace'}}>⚠ {error}</div>}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>

            {[{label:'Last CP',value:lastCP?`${lastCP}s`:'—',sub:'control pause'},{label:'Walk Steps',value:lastSteps??'—',sub:'breath hold'},{label:'Avg Pain',value:avgPain??'—',sub:`${logs.length} entries`}].map(s=>(

              <div key={s.label} style={{background:'rgba(255,255,255,0.04)',border:'1px solid #1e3a5f',borderRadius:8,padding:'10px 12px'}}>

                <div style={{fontSize:11,color:'#546e8a',letterSpacing:1,textTransform:'uppercase',fontFamily:'monospace'}}>{s.label}</div>

                <div style={{fontSize:22,color:'#4a9eff',margin:'2px 0',fontWeight:300}}>{s.value}</div>

                <div style={{fontSize:10,color:'#3a5272',fontFamily:'monospace'}}>{s.sub}</div>

              </div>

            ))}

          </div>

        </div>

      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'0 24px'}}>

        <div style={{display:'flex',marginTop:20,marginBottom:24,border:'1px solid #1e3a5f',borderRadius:8,overflow:'hidden'}}>

          {[['log','Log Entry'],['history','History'],['stats','Patterns']].map(([v,label])=>(

            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:'10px 0',border:'none',cursor:'pointer',fontFamily:'monospace',fontSize:11,letterSpacing:1,textTransform:'uppercase',background:view===v?'#1a3a6e':'transparent',color:view===v?'#4a9eff':'#546e8a',transition:'all 0.2s'}}>{label}</button>

          ))}

        </div>

        {view==='log'&&(

          <div style={{display:'flex',flexDirection:'column',gap:20}}>

            <div style={card}>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:16}}>

                <span style={lbl}>Sinus Inflammation</span>

                <span style={{fontSize:11,color:getPainColor(form.pain),fontFamily:'monospace'}}>{getPainLabel(form.pain)}</span>

              </div>

              <div style={{display:'flex',alignItems:'center',gap:16}}>

                <span style={{fontSize:48,fontWeight:300,color:getPainColor(form.pain),minWidth:60,textAlign:'center',lineHeight:1,transition:'color 0.3s'}}>{form.pain}</span>

                <div style={{flex:1}}>

                  <input type="range" min={0} max={10} value={form.pain} onChange={e=>setForm(p=>({...p,pain:Number(e.target.value)}))} style={{width:'100%',accentColor:getPainColor(form.pain)}}/>

                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#3a5272',fontFamily:'monospace',marginTop:4}}><span>0 none</span><span>10 severe</span></div>

                </div>

              </div>

            </div>

            <div style={card}>

              <span style={lbl}>Buteyko Metrics</span>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

                {[['cp','Control Pause (sec)','e.g. 17'],['steps','Walk Steps','e.g. 23']].map(([key,label,ph])=>(

                  <div key={key}>

                    <label style={{fontSize:11,color:'#3a5272',fontFamily:'monospace',display:'block',marginBottom:6}}>{label}</label>

                    <input type="number" placeholder={ph} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',background:'#071018',border:'1px solid #1e3a5f',borderRadius:6,padding:'10px 12px',color:'#c8d8f0',fontSize:16,fontFamily:'monospace',boxSizing:'border-box'}}/>

                  </div>

                ))}

              </div>

            </div>

            <div style={card}>

              <span style={lbl}>Today's Practice</span>

              <div style={{display:'flex',flexDirection:'column',gap:10}}>

                {[['practiced','✓ Buteyko exercises done'],['taped','✓ Mouth taped last night']].map(([key,label])=>(

                  <button key={key} onClick={()=>setForm(p=>({...p,[key]:!p[key]}))} style={{display:'flex',alignItems:'center',gap:12,background:form[key]?'rgba(74,158,255,0.1)':'rgba(255,255,255,0.02)',border:`1px solid ${form[key]?'#1a3a6e':'#1e3a5f'}`,borderRadius:8,padding:'12px 14px',cursor:'pointer',color:form[key]?'#4a9eff':'#546e8a',fontSize:13,fontFamily:'Georgia,serif',textAlign:'left',transition:'all 0.2s'}}>

                    <span style={{width:18,height:18,borderRadius:4,background:form[key]?'#1a3a6e':'transparent',border:`1px solid ${form[key]?'#4a9eff':'#3a5272'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#4a9eff',flexShrink:0}}>{form[key]?'✓':''}</span>

                    {label}

                  </button>

                ))}

              </div>

            </div>

            <div style={card}>

              <span style={lbl}>Flare Factors</span>

              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>

                {flareFactors.map(f=>(

                  <button key={f} onClick={()=>toggleFactor(f)} style={{padding:'6px 12px',borderRadius:20,cursor:'pointer',border:`1px solid ${form.factors.includes(f)?'#4a9eff':'#1e3a5f'}`,background:form.factors.includes(f)?'rgba(74,158,255,0.15)':'transparent',color:form.factors.includes(f)?'#4a9eff':'#546e8a',fontSize:12,fontFamily:'monospace',transition:'all 0.2s'}}>{f}</button>

                ))}

              </div>

            </div>

            <div style={card}>

              <span style={lbl}>Notes</span>

              <textarea placeholder="Any observations, patterns, symptoms..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3} style={{width:'100%',background:'#071018',border:'1px solid #1e3a5f',borderRadius:6,padding:'10px 12px',color:'#c8d8f0',fontSize:13,fontFamily:'Georgia,serif',resize:'none',boxSizing:'border-box',lineHeight:1.6}}/>

            </div>

            <button onClick={submitLog} disabled={saving} style={{background:saved?'linear-gradient(135deg,#14532d,#166534)':'linear-gradient(135deg,#1a3a6e,#0d2244)',border:`1px solid ${saved?'#4ade80':'#4a9eff'}`,borderRadius:10,padding:'16px',cursor:saving?'wait':'pointer',color:saved?'#4ade80':'#4a9eff',fontSize:13,letterSpacing:3,textTransform:'uppercase',fontFamily:'monospace',transition:'all 0.3s'}}>

              {saving?'SAVING...':saved?'✓ SAVED':'SAVE ENTRY'}

            </button>

          </div>

        )}

        {view==='history'&&(

          <div style={{display:'flex',flexDirection:'column',gap:12}}>

            <button onClick={loadLogs} style={{background:'transparent',border:'1px solid #1e3a5f',borderRadius:8,padding:'8px 16px',color:'#546e8a',fontFamily:'monospace',fontSize:11,letterSpacing:1,cursor:'pointer',textTransform:'uppercase',marginBottom:4}}>↻ Refresh</button>

            {loading&&<div style={{textAlign:'center',color:'#546e8a',padding:'40px 0',fontFamily:'monospace',fontSize:12}}>LOADING...</div>}

            {!loading&&logs.length===0&&<div style={{textAlign:'center',color:'#3a5272',padding:'40px 0',fontFamily:'monospace',fontSize:12}}>No entries yet</div>}

            {logs.map(log=>(

              <div key={log.id} style={{background:'#0d1b2a',border:'1px solid #1e3a5f',borderRadius:12,padding:'16px 18px',borderLeft:`3px solid ${getPainColor(Number(log.pain))}`}}>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>

                  <div>

                    <div style={{fontSize:13,color:'#8aafd4',fontFamily:'monospace'}}>{formatDate(log.timestamp)}</div>

                    <div style={{fontSize:11,color:'#3a5272',fontFamily:'monospace'}}>{formatTime(log.timestamp)}</div>

                  </div>

                  <div style={{textAlign:'right'}}>

                    <span style={{fontSize:28,fontWeight:300,color:getPainColor(Number(log.pain)),lineHeight:1}}>{log.pain}</span>

                    <div style={{fontSize:10,color:getPainColor(Number(log.pain)),fontFamily:'monospace'}}>{getPainLabel(Number(log.pain))}</div>

                  </div>

                </div>

                <div style={{display:'flex',gap:16,fontSize:11,fontFamily:'monospace',color:'#546e8a',flexWrap:'wrap',marginBottom:(log.factors?.length||log.notes)?10:0}}>

                  {log.cp&&<span>CP: <span style={{color:'#4a9eff'}}>{log.cp}s</span></span>}

                  {log.steps&&<span>Steps: <span style={{color:'#4a9eff'}}>{log.steps}</span></span>}

                  {(log.practiced===true||log.practiced==='true')&&<span style={{color:'#4ade80'}}>✓ Practiced</span>}

                  {(log.taped===true||log.taped==='true')&&<span style={{color:'#4ade80'}}>✓ Taped</span>}

                </div>

                {log.factors?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:log.notes?8:0}}>{log.factors.map(f=><span key={f} style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:'rgba(74,158,255,0.08)',border:'1px solid #1e3a5f',color:'#546e8a',fontFamily:'monospace'}}>{f}</span>)}</div>}

                {log.notes&&<div style={{fontSize:12,color:'#546e8a',fontStyle:'italic',lineHeight:1.5}}>{log.notes}</div>}

              </div>

            ))}

          </div>

        )}

        {view==='stats'&&(

          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {logs.length<2?<div style={{textAlign:'center',color:'#3a5272',padding:'40px 0',fontFamily:'monospace',fontSize:12}}>Log at least 2 entries to see patterns</div>:(

              <>

                <div style={card}>

                  <span style={lbl}>Pain Trend</span>

                  <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>

                    {[...logs].reverse().slice(-10).map(log=>(

                      <div key={log.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>

                        <div style={{width:'100%',background:getPainColor(Number(log.pain)),borderRadius:3,opacity:0.8,height:`${Math.max(4,(Number(log.pain)/10)*60)}px`}}/>

                        <span style={{fontSize:9,color:'#3a5272',fontFamily:'monospace'}}>{log.pain}</span>

                      </div>

                    ))}

                  </div>

                  <div style={{fontSize:11,color:'#3a5272',fontFamily:'monospace',marginTop:8}}>Last {Math.min(logs.length,10)} entries →</div>

                </div>

                {logs.filter(l=>l.cp).length>=2&&(

                  <div style={card}>

                    <span style={lbl}>CP Progress</span>

                    <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>

                      {[...logs].reverse().filter(l=>l.cp).slice(-10).map(log=>(

                        <div key={log.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>

                          <div style={{width:'100%',background:'#4a9eff',borderRadius:3,opacity:0.7,height:`${Math.max(4,(Number(log.cp)/40)*60)}px`}}/>

                          <span style={{fontSize:9,color:'#3a5272',fontFamily:'monospace'}}>{log.cp}s</span>

                        </div>

                      ))}

                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#3a5272',fontFamily:'monospace',marginTop:4}}><span>Target: 30s</span><span>Current: {lastCP}s</span></div>

                  </div>

                )}

                <div style={card}>

                  <span style={lbl}>Summary</span>

                  <div style={{display:'flex',flexDirection:'column',gap:10}}>

                    {[['Average pain',`${avgPain} / 10`],['Practice adherence',`${practiceDays} / ${logs.length} days`],['Tape adherence',`${tapeDays} / ${logs.length} nights`],['Total entries',logs.length]].map(([label,value])=>(

                      <div key={label} style={{display:'flex',justifyContent:'space-between',paddingBottom:8,borderBottom:'1px solid #071018'}}>

                        <span style={{fontSize:12,color:'#546e8a',fontFamily:'monospace'}}>{label}</span>

                        <span style={{fontSize:14,color:'#4a9eff',fontFamily:'monospace'}}>{value}</span>

                      </div>

                    ))}

                  </div>

                </div>

                {topFactors.length>0&&(

                  <div style={card}>

                    <span style={lbl}>Top Flare Factors</span>

                    <div style={{display:'flex',flexDirection:'column',gap:10}}>

                      {topFactors.map(([factor,count])=>(

                        <div key={factor}>

                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>

                            <span style={{fontSize:12,color:'#8aafd4',fontFamily:'monospace'}}>{factor}</span>

                            <span style={{fontSize:12,color:'#4a9eff',fontFamily:'monospace'}}>{count}×</span>

                          </div>

                          <div style={{height:4,background:'#071018',borderRadius:2}}>

                            <div style={{height:'100%',borderRadius:2,background:'#1a3a6e',width:`${(count/logs.length)*100}%`}}/>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                )}

              </>

            )}

          </div>

        )}

      </div>

    </div>

  )

}
