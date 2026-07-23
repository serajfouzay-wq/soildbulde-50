from PIL import Image
import os
for f in ["img-fifty.png","img-sb-logo.png","img-title.png","img-rsvp.png","img-eventbox.png"]:
    p="public/"+f
    if not os.path.exists(p): continue
    im=Image.open(p).convert("RGBA"); px=im.load(); w,h=im.size; n=0
    for y in range(h):
        for x in range(w):
            r,g,b,a=px[x,y]
            if a==0: continue
            mx,mn=max(r,g,b),min(r,g,b)
            sat=mx-mn; lum=(r*299+g*587+b*114)//1000
            if lum>185 and sat<28:
                if sat<=14: px[x,y]=(r,g,b,0); n+=1
                else: px[x,y]=(r,g,b,int(255*(sat-14)/14))
    bb=im.getbbox()
    if bb: im=im.crop(bb)
    im.save(p)
    print("  %-18s cleared %d px  -> %dx%d" % (f,n,im.size[0],im.size[1]))
print("DONE strip")
