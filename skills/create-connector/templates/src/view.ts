// MCP Apps view: one self-contained HTML page rendered by the host (claude.ai) in a sandboxed iframe.
// It speaks the MCP Apps postMessage protocol directly (no bundler, no external scripts).
// Kinds: "detail" (title, subtitle, rows) and "list" (rows with optional click-through `call` or external `url`).
// Keep backticks and ${ out of the view code: it lives inside a String.raw template literal.
export const VIEW_URI = "ui://my-connector/card.html";
export const VIEW_MIME = "text/html;profile=mcp-app";
// Every host the view loads images/assets from must be listed, or the host blocks it.
export const VIEW_CSP = { resourceDomains: [] as string[] };

export const VIEW_HTML = /* html */ String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#fff;--fg:#1d1b26;--mut:#6b6679;--line:#e6e6ee;--accent:#4b2e83}
:root[data-theme=dark]{--bg:#17161d;--fg:#ece9f5;--mut:#a29cb5;--line:#34323f;--accent:#a68ce0}
body{margin:0;font:14px/1.45 system-ui,sans-serif;background:var(--bg);color:var(--fg)}
.card{padding:14px 16px}h1{margin:0;font-size:18px;color:var(--accent)}.sub{color:var(--mut);margin:2px 0 10px}
.row{padding:8px 0;border-top:1px solid var(--line)}.row.go{cursor:pointer}.row .t{font-weight:600}.row .s{color:var(--mut);font-size:13px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;margin:0}dt{color:var(--mut)}dd{margin:0}
a{color:var(--accent)}.note{color:var(--mut);font-size:12px;margin-top:10px}
</style></head><body><div id="root"></div><script>
(function(){
var root=document.getElementById("root"),nextId=2,pending={};
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function add(p,c){if(c)p.appendChild(c);return p}
function send(m){parent.postMessage(Object.assign({jsonrpc:"2.0"},m),"*")}
function request(method,params){return new Promise(function(res,rej){var id=nextId++;pending[id]={res:res,rej:rej};send({id:id,method:method,params:params})})}
function size(){send({method:"ui/notifications/size-changed",params:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}})}
function theme(ctx){if(ctx&&ctx.theme)document.documentElement.setAttribute("data-theme",ctx.theme)}
function textOf(r){return(r&&r.content||[]).map(function(c){return c.text||""}).join("\n")}
function link(label,url){var a=el("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function detail(d){var c=el("div","card");add(c,el("h1",null,(d.icon?d.icon+" ":"")+(d.name||"")));if(d.subtitle)add(c,el("div","sub",d.subtitle));
 var dl=el("dl");(d.rows||[]).forEach(function(r){if(r[1]==null||r[1]==="")return;add(dl,el("dt",null,r[0]));add(dl,el("dd",null,String(r[1])))});add(c,dl);
 if(d.sources)add(c,el("div","note","Source: "+d.sources));return c}
function list(d){var c=el("div","card");add(c,el("h1",null,d.title||""));if(d.sub)add(c,el("div","sub",d.sub));
 (d.items||[]).forEach(function(it){var r=el("div","row");var t=el("div","t");if(it.url)add(t,link(it.title,it.url));else t.textContent=(it.icon?it.icon+" ":"")+it.title;add(r,t);if(it.sub)add(r,el("div","s",it.sub));
  if(it.call){r.classList.add("go");r.addEventListener("click",function(){go(it.call)})}add(c,r)});
 if(d.sources)add(c,el("div","note","Source: "+d.sources));return c}
function show(d){root.textContent="";var f=d.kind==="list"?list:d.kind==="detail"?detail:null;
 if(f)add(root,f(d));else add(root,add(el("div","card"),el("div",null,d.text||"No visual data.")));size()}
function go(call){request("tools/call",call).then(function(r){var d=r&&r.structuredContent;show(d&&!r.isError?d:{kind:"text",text:textOf(r)||"No result."})},function(e){show({kind:"text",text:"Could not load: "+(e&&e.message||"error")})})}
window.addEventListener("message",function(e){var m=e.data;if(!m||m.jsonrpc!=="2.0")return;
 if(m.id!=null&&pending[m.id]&&(m.result!==undefined||m.error)){var p=pending[m.id];delete pending[m.id];if(m.error)p.rej(m.error);else p.res(m.result);return}
 if(m.method==="ui/notifications/tool-result"){var r=m.params||{};show(r.structuredContent||{kind:"text",text:textOf(r)||"No visual data for this result."})}
 else if(m.method==="ui/notifications/host-context-changed"){theme(m.params)}
 else if(m.method==="ui/resource-teardown"&&m.id!=null){send({id:m.id,result:{}})}
});
if(window.ResizeObserver)new ResizeObserver(size).observe(document.body);
request("ui/initialize",{appInfo:{name:"my-connector-card",version:"1.0.0"},appCapabilities:{},protocolVersion:"2026-01-26"}).then(function(r){if(r)theme(r.hostContext);send({method:"ui/notifications/initialized",params:{}});size()},function(){});
})();
</script></body></html>`;
