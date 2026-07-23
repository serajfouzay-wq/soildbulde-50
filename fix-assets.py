from PIL import Image
im=Image.open("public/orig/img-eventbox.png").convert("RGBA")
w,h=im.size; px=im.load()
# tune these 4 if the erase is off
X0,X1,Y0,Y1 = 0.255, 0.945, 0.285, 0.905
for y in range(int(h*Y0),int(h*Y1)):
    for x in range(int(w*X0),int(w*X1)):
        px[x,y]=(0,0,0,0)
for y in range(h):
    for x in range(w):
        r,g,b,a=px[x,y]
        if a==0: continue
        mx,mn=max(r,g,b),min(r,g,b)
        if (r*299+g*587+b*114)//1000>185 and mx-mn<28: px[x,y]=(r,g,b,0)
im.save("public/img-eventbox.png")
print("OK eventbox cleaned  %dx%d" % (w,h))
