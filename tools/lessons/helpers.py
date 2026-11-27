# Helpers for writing lesson files. Usage: from helpers import *; add_week('p1','p1-w2',W)
import json, os
ROOT=os.path.join(os.path.dirname(__file__),'..','..')
def ex(q,a,s=""): return {"q":q,"a":a,"s":s}
def rd(book,where,why=""): return {"book":book,"where":where,"why":why}
def sv(label,book=None,drill=None):
    d={"label":label}
    if book: d["book"]=book
    if drill: d["drill"]=drill
    return d
def dr(sec,topic,n,min,target="80%"): return {"sec":sec,"topic":topic,"n":n,"min":min,"target":target}
def part(name,read,notes,examples,solve): return {"name":name,"read":read,"notes":notes,"examples":examples,"solve":solve}
def week(hours,testTopics,q,r,e,g): return {"hours":hours,"testTopics":testTopics,"units":{"q":q,"r":r,"e":e,"g":g}}
def unit(title,parts): return {"title":title,"parts":parts}
def add_week(phase,key,W):
    p=os.path.join(ROOT,'data','lessons',phase+'.json'); d=json.load(open(p)) if os.path.exists(p) else {}
    d[key]=W; json.dump(d,open(p,'w'),indent=1,ensure_ascii=False); print('wrote',key,sum(len(u['parts']) for u in W['units'].values()),'parts')
RSA="R.S. Aggarwal, Quantitative Aptitude"; KM="Kiran, SSC Maths Chapterwise Solved Papers"
RV="R.S. Aggarwal, Verbal & Non-Verbal Reasoning"; KR="Kiran, SSC Reasoning Chapterwise Solved Papers"
WM="Wren & Martin, High School English Grammar & Composition"; SB="S.P. Bakshi, Objective General English"; NL="Norman Lewis, Word Power Made Easy"
LX="M. Laxmikanth, Indian Polity"; SP="Spectrum, A Brief History of Modern India"; NC="NCERT Class 11, Indian Constitution at Work"
HRS="About 3.5 hours a day: Quant 60 min, Reasoning 45, English 45, GA 40, review 20. Saturday is the weekly test."
