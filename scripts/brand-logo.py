# Generates the Tajdîn logo SVGs in assets/brand/ from the deq Roj geometry.
# Usage: python3 scripts/brand-logo.py (writes into the current directory).
import math
def geo(cx, cy, s):
    def arc(r, a0=180, a1=360):
        r*=s
        p=lambda a:(cx+r*math.cos(math.radians(a)), cy+r*math.sin(math.radians(a)))
        (x0,y0),(x1,y1)=p(a0),p(a1)
        return f'M{x0:.1f} {y0:.1f} A{r:.1f} {r:.1f} 0 0 1 {x1:.1f} {y1:.1f}'
    def rays(r0,r1,n=7):
        o=[]
        for i in range(n):
            a=math.radians(180+i*180/(n-1))
            o.append(f'M{cx+r0*s*math.cos(a):.1f} {cy+r0*s*math.sin(a):.1f} L{cx+r1*s*math.cos(a):.1f} {cy+r1*s*math.sin(a):.1f}')
        return ' '.join(o)
    return arc, rays
DEFS='''<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E2A78"/><stop offset="1" stop-color="#0F0F23"/></linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs>'''
def mark(cx, cy, s, sun='url(#sun)', wave='#F8FAFC', dot='#22C55E', wave_on=True, sw=30):
    arc, rays = geo(cx, cy, s)
    out=f'<path d="{arc(132)} {rays(132,200)}" fill="none" stroke="{sun}" stroke-width="{sw*s:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
    if wave_on: out+=f'<path d="{arc(74,205,335)}" fill="none" stroke="{wave}" stroke-width="{24*s:.1f}" stroke-linecap="round"/>'
    out+=f'<circle cx="{cx}" cy="{cy}" r="{24*s:.1f}" fill="{dot}"/>'
    return out
def svg(body, tile=True):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{DEFS}{"<rect width=\"512\" height=\"512\" rx=\"116\" fill=\"url(#bg)\"/>" if tile else ""}{body}</svg>'
# App/store icon: tile, mark scaled to fill
open('tajdin-icon.svg','w').write(svg(mark(256, 352, 1.12)))
# Toolbar glyph (no tile), stroke thicker so it survives 16px
open('toolbar-idle.svg','w').write(svg(mark(256, 400, 1.22, sun='#94A3B8', wave='#94A3B8', dot='#94A3B8', sw=38), tile=False))
open('toolbar-play-1.svg','w').write(svg(mark(256, 400, 1.22, sun='#F59E0B', wave_on=False, dot='#16A34A', sw=38), tile=False))
open('toolbar-play-2.svg','w').write(svg(mark(256, 400, 1.22, sun='#F59E0B', wave='#16A34A', dot='#16A34A', sw=38), tile=False))
open('toolbar-paused.svg','w').write(svg(mark(256, 400, 1.22, sun='#F59E0B', wave='#94A3B8', dot='#94A3B8', sw=38), tile=False))
# Monochrome marks for docs / light & dark backgrounds
open('tajdin-mark-dark.svg','w').write(svg(mark(256, 400, 1.22, sun='#0F0F23', wave='#0F0F23', dot='#16A34A', sw=34), tile=False))
open('tajdin-mark-light.svg','w').write(svg(mark(256, 400, 1.22, sun='#F8FAFC', wave='#F8FAFC', dot='#22C55E', sw=34), tile=False))
