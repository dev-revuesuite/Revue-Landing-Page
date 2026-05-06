// Theme toggle
const tt=document.getElementById('themeToggle');
tt.addEventListener('click',()=>{
  const d=document.documentElement;
  d.setAttribute('data-theme',d.getAttribute('data-theme')==='dark'?'':'dark');
});

// Nav
const nb=document.getElementById('navbar');window.addEventListener('scroll',()=>nb.classList.toggle('scrolled',window.scrollY>20));
document.getElementById('mt').addEventListener('click',function(){document.getElementById('navLinks').classList.toggle('open');this.classList.toggle('open');});
document.getElementById('navLinks').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.getElementById('navLinks').classList.remove('open');document.getElementById('mt').classList.remove('open');}));

// Tabs
document.querySelectorAll('.ptab').forEach(t=>{t.addEventListener('click',()=>{document.querySelectorAll('.ptab').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.querySelectorAll('.tc').forEach(c=>c.classList.remove('active'));document.getElementById('tab-'+t.dataset.tab).classList.add('active')});});

// Feature items
document.querySelectorAll('.fi').forEach(i=>{i.addEventListener('click',()=>{const l=i.closest('.fl');l.querySelectorAll('.fi').forEach(x=>x.classList.remove('active'));i.classList.add('active');const sImg=i.querySelector('img.feature-source-img');const s=sImg?sImg.src:null;if(s){const img=i.closest('.fg').querySelector('.fd img');img.style.opacity='0';setTimeout(()=>{img.src=s;img.alt=i.textContent.trim();img.style.opacity='1'},150)}});});

// FAQ
document.querySelectorAll('.fqq').forEach(b=>{b.addEventListener('click',()=>{const i=b.closest('.fqi'),a=i.querySelector('.fqa'),o=i.classList.contains('open');document.querySelectorAll('.fqi').forEach(x=>{x.classList.remove('open');x.querySelector('.fqa').style.maxHeight=null});if(!o){i.classList.add('open');a.style.maxHeight=a.scrollHeight+'px'}});});

// Reveal
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.1,rootMargin:'0px 0px -30px 0px'});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Pricing toggle
document.querySelectorAll('.tb').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.tb').forEach(x=>x.classList.remove('active'));b.classList.add('active')});});
