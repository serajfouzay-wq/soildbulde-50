import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

rep('pushDrawState({ active:true, spinning:false, winners:[], countdown:3 });',
    'pushDrawState({ active:true, spinning:false, winners:[], countdown:3, revealedCount:0 });',
    "start draw resets reveal")

rep('pushDrawState({active:true,spinning:false,winners:[],countdown:c});',
    'pushDrawState({active:true,spinning:false,winners:[],countdown:c,revealedCount:0});',
    "countdown keeps reset")

rep('pushDrawState({active:true,spinning:true,winners:[],countdown:null});',
    'pushDrawState({active:true,spinning:true,winners:[],countdown:null,revealedCount:0});',
    "spin start resets reveal")

rep('pushDrawState({ active:true, spinning:false, winners:newWinners, countdown:null });',
    'pushDrawState({ active:true, spinning:false, winners:newWinners, countdown:null, revealedCount:0, displayMode });',
    "winners land hidden")

rep('pushDrawState({ active:false, spinning:false, winners:[], countdown:null });',
    'pushDrawState({ active:false, spinning:false, winners:[], countdown:null, revealedCount:0, spinDisplay:"SE000" });',
    "clear screen full reset")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))
