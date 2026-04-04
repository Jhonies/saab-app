import re
import json

raw_data = """
CAMARA FRIA

7 caixas chuck short ribs creekstone
1 caixa short rib plate nc
5 caixas inside round Omaha
1 caixa pork belly sadia
2 caixas boneless beef top sirloin IBP
3 caixas queijo em barra
48 caixas short ribs macesa
38 caixas catupiry
17 caixas beef eye round macesa
1 caixa chuck roll diezmillo sukarne
1 caixa pork belly Patel
2 caixas tripa para tacos
3 caixas pork belly daisyfield
37 caixas tri tip macesa
1 caixa hind shank Pradera
1 caixa chuck roll bone in sukarne
4 caixas tenderloin 3/4 BR
7 caixas picanha wagyu SRF
9 caixas outside round nc
1 caixa flap meat wingham
1 caixa knuckle sukarne
1 caixa bone in Pradera
4 caixas picanha IBP choice
19 caixas beef flat iron macesa
11 caixas picanha Greenstock
13 caixas ribeye nc
39 caixas knuckle arrebeef
14 caixas inside round nc
1 caixa tenderloin 5up
2 caixas rose meat Pradera
14 caixas heel meat SM
23 caixas flap meat uruguaio
2 caixas flat bottom national
1 caixa pork smoked Lee
2 caixas hind shank Pradera
8 caixas beef round flat creekstone
34 caixas chuck roll nc
1 caixa pork sirloin roast wholestone
50 caixas queijo em barra
27 caixas pork belly altosano
10 caixas sirloin butt nc
29 caixas short ribs nc
1 caixa ribeye nc
1 caixa rose meat Pradera
31 caixas assado de tira nc
1 caixa strip loin nc
5 caixas small intestine swift
6 caixas eye round macesa
20 caixas short rib plate nc
6 caixas prime steak nc
3 caixas sirloin roast wholestone
7 caixas back ribs nc
15 caixas tenderloin 5up
6 caixas oxtail whole Pradera
1 caixa chuck roll bone in Pradera
8 caixas ribeye Pradera
2 caixas manteca cap lard
2 caixas new york steak nc
15 caixas porterhouse nc
1 caixa pork loin boneless Smithfield
5 caixas stewing hens B&B
5 caixas baking hens tip top
5 caixas beef head H&B
8 caixas pork smoked Lee
2 caixas tripa para tacos
18 caixas hind shank Pradera
1 caixa pectoral creekstone
6 caixas pork stomach Daisyfield
1 caixa boneless beef top sirloin IBP
36 caixas chuck roll nc
5 caixas beef puyazo macesa
17 caixas tenderloin 3/4 BR
1 caixa chicken drumsticks house of Raeford

CONTAINER 36

30 caixas honey comb Gico
5 caixas short rib plate NC
20 caixas beef tongue NC
28 caixas tostones Hawaiian
22 caixas yuca chunks
22 caixas batata frita
43 caixas neck bone macesa
28 caixas short ribs IBP
31 caixas flap meat uruguaio
73 caixas picanha Gorina
293 caixas tenderloin 3/4 BR
2 caixas tenderloin 4/5 BR
39 caixas tenderloin 5uP

CONTAINER 33

7 caixas beef tripe IBP
3 caixas sweet plantain
2 caixas cheek meat national
19 caixas back ribs NC
11 caixas tenderloin 4/5 Gorina
14 caixas honey comb swift
6 caixas pork hind feet seaboard
8 caixas pork skin olymel
20 caixas mofongo balls
7 caixas tripa para tacos amigos
3 caixas tenderloin 3/4 paraguio
1 caixa tenderloin 5uP
3 caixas turkey neck Canada
23 caixas inside round Gorina
5 caixas turkey wing Canada
2 caixas beef livers IBP
9 caixas small intestine swift
4 caixas beef feet IBP
5 caixas pork ears Viandes
3 caixas pork tongue swift
3 caixas sweetbread Swift
10 caixas beef tail Teys
8 caixas beef omasum
3 caixas lip unscalded Swift
5 caixas picanha two rivers
7 caixas pork loin sem marca
3 caixas pork tail Smithfield
8 caixas pork hock long Farmland
1 caixa beef tongue Friboi
118 caixas pork belly sadia
75 caixas knuckle arrebeef
1 caixa chicken hearts Amick
1 caixa chicken breast house of Raeford

CONTAINER 32

10 caixas tenderloin 5up
10 caixas tenderloin 4/5 BR
5 caixas lifter meat macesa
5 caixas strip loin NC
28 caixas chuck tender macesa
16 caixas chuck roll
26 caixas picanha two rivers
14 caixas tri tip macesa
18 caixas beef sirloin butt macesa
1 caixa back ribs NC
36 caixas inside round macesa
25 caixas beef flat bottom SM
50 caixas chicken heart mountaire
91 caixas picanha Alberta

CONTAINER 31

2 caixas young chicken Koch foods
2 caixas tenderloin 4/5 BR
4 caixas pork ham Conestoga
26 caixas knuckle arrebeef
4 caixas chicken whole fryers Koch
20 caixas flap meat Greenham
1 caixa chicken tenders emmaus foods
2 caixas chicken paws case Farms
1 caixa cornish hens
1 caixa mutton swift
6 caixas party wings Koch
2 caixas pork hind feet Smithfield
2 caixas beef head Lowa beef
3 caixas Thomas Lamp
17 caixas picanha Gorina
8 caixas boneless skinless Koch
5 caixas chicken hearts Amick
3 caixas brisket macesa
24 caixas flap meat
4 caixas chicken gizzards mountaire
2 caixas 1/4 leg country post
2 caixas stewing hens
6 caixas turkey necks
47 caixas beef feet macesa
5 caixas chicken drumsticks
4 caixas pork salt dry
1 caixa cheek meat national
18 caixas flap meat natural flinders
37 caixas frango caipira
1 caixa beef feet IBP
74 caixas yuca fries
76 caixas sweet plantain
1 caixa tenderloin 3/4 Paraguay com fita
3 caixas short ribs American foods
3 caixas lava cake
2 caixas or 27
1 caixa or 15
1 caixa or 27 s/p
2 caixas or 18
1 caixa or 52
1 caixa or 28 pimenta biquinho

SECOS

Nassif
189 caixas polvilho azedo
137 caixas polvilho doce
70 caixas palmito tolete
78 caixas palmito whole

Saab
411 caixas polvilho doce
436 caixas polvilho azedo
354 caixas palmito 500g
53 caixas palmito grande

BEBIDAS

551 caixas terra brazilis
859 caixas 51 gold
104 caixas 51 diver
31 caixas garibaldi glera
123 caixas mix
32 caixas pergola sweet 750 ml
6 caixas pergola bordo demi sec
28 caixas reserva unica
26 caixas reserva rara
36 caixas reserva singular
17 caixas keg chop
13 caixas suco de uva
14 caixas jambu
7 caixas melt rose
19 caixas tannat
5 caixas garibaldi moscatel
5 caixas garibaldi chardonnay brut
14 caixas garibaldi espumante pinot noir
7 caixas bananinha
2 caixas garibaldi vg brut rose
1 caixa garibaldi veto demi sec rose
2 caixas garibaldi wine chardonnay
6 caixas garibaldi veto demi sec
3 caixas garibaldi vg extra brut
47 caixas vodka
2769 caixas imperio ultra
4169 caixas imperio gold
3097 caixas imperio lager
77 caixas baly green apple
70 caixas baly original sugar free
256 caixas baly original
244 caixas baly tropical

1 garrafa vodka
8 garrafas pergola 1 litro
5 garrafas 51 gold
10 garrafas pergola medium dry
6 garrafas pergola sweet
1 garrafa garibaldi vero demisec
2 garrafas melt rose
6 garrafas melt brut
6 garrafas garibaldi extra brut
4 garrafas pergola dry red wine
10 garrafas pergola sweet
10 garrafas garibaldi wine chardonnay
14 garrafas draft wine
10 unidades suco
22 garrafas garibaldi glera
1 unidade bananinhas
1 garrafa terra brazilis
9 garrafas garibaldi moscatel
10 garrafas garibaldi vero demisec rose
14 garrafas garibaldi vero brut rose
39 garrafas 51 silver
4 garrafas cachaca jambu
1 garrafa reserva rara
1 garrafa mix reserva
10 garrafas garibaldi rose extra brut
27 garrafas imperio lager
13 garrafas imperio gold
5 garrafas garibaldi tannat

"""

lines = raw_data.split('\n')
zones = {'CAMARA FRIA': 'CAMARA_FRIA', 'CONTAINER 36': 'CONTAINER_36', 'CONTAINER 33': 'CONTAINER_33', 'CONTAINER 32': 'CONTAINER_32', 'CONTAINER 31': 'CONTAINER_31', 'SECOS': 'SECOS', 'BEBIDAS': 'BEBIDAS'}
current_zone = None
items = []

for line in lines:
    line = line.strip()
    if not line or line.lower() in ['nassif', 'saab']:
        continue
    
    if line in zones.keys():
        current_zone = zones[line]
        continue
        
    m = re.match(r'^(\d+)\s+(caixas?|garrafas?|unidades?|unidade?)\s+(.*)$', line, re.IGNORECASE)
    if m:
        qty = int(m.group(1))
        unit = m.group(2).lower()
        name = m.group(3).strip()
        items.append({'zone': current_zone, 'qty': qty, 'unit': unit, 'name': name})
    else:
        print(f'Unparsed: {line}')

with open('seed_data.json', 'w') as f:
    json.dump(items, f, indent=2)
