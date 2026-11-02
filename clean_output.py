import json

with open(r'C:\Users\User\Desktop\TP\m45_ranked_full.json', 'r', encoding='utf-8') as f:
    ranked = json.load(f)

print(f'Total ranked in json: {len(ranked)}')
with open(r'C:\Users\User\Desktop\TP\m45_ranked_clean.txt', 'w', encoding='utf-8') as out:
    for i, a in enumerate(ranked):
        r = a.get('rankOverall')
        name = a.get('fullName')
        country = a.get('country')
        bib = a.get('bib')
        score = a.get('score')
        sw = a.get('scoreSwim')
        bk = a.get('scoreBike')
        rn = a.get('scoreRun')
        out.write(f"{i+1:2d}. AG Rank {r:2d} | Bib {bib} | {name:<22} | {country:<12} | PowerIndex: {score:5.1f} | (S:{sw} B:{bk} R:{rn})\n")

print('Wrote clean text successfully.')
