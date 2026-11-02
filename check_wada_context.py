with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

for name, idx in [('Yoshihiro Wada', 29908), ('Wai Kit Woo', 62573)]:
    print(f'=== {name} ===')
    start = max(0, idx - 200)
    end = min(len(text), idx + 800)
    print(text[start:end])
