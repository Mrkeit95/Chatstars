// Chat Trial AI — Netlify Function
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lescdotlrpmkumlgizsi.supabase.co/rest/v1';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function cors(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}}

export default async(req)=>{
  if(req.method==='OPTIONS')return new Response('',{status:200,headers:cors()});
  try{
    const body=await req.json();
    if(body.action==='grade')return await gradeSession(body);

    const{creator,fan_persona,messages,is_first}=body;
    const systemPrompt=buildSystem(creator,fan_persona);

    // Build messages for Claude
    const claudeMsgs=[];
    if(is_first){
      claudeMsgs.push({role:'user',content:'You are the fan. Send your FIRST message to the creator. Keep it short (1-2 sentences), casual, like a real DM. Just the message text, nothing else.'});
    }else{
      // Reconstruct conversation: fan=assistant, chatter=user
      const history=(messages||[]).slice(-20);
      for(const m of history){
        if(m.role==='fan')claudeMsgs.push({role:'assistant',content:m.content});
        else claudeMsgs.push({role:'user',content:m.content});
      }
      // Prompt for next fan message
      claudeMsgs.push({role:'user',content:'[Reply as the fan. Stay in character. 1-3 sentences max. Just the message, no labels or meta text. React naturally to what was just said. Progress the conversation — ask something new, respond to their offer, or test them.]'});
    }

    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:200,system:systemPrompt,messages:claudeMsgs})
    });

    if(!res.ok){
      const errText=await res.text();
      console.log('API error:',res.status,errText);
      // Varied fallbacks based on conversation length
      const msgCount=(messages||[]).length;
      return jsonRes({message:getFallback(msgCount,is_first)});
    }

    const data=await res.json();
    let reply=data.content?.[0]?.text||'';
    // Clean up any meta text the AI might add
    reply=reply.replace(/^\[.*?\]\s*/,'').replace(/^(Fan|Subscriber|Message):\s*/i,'').trim();
    if(!reply)reply=getFallback((messages||[]).length,is_first);

    return jsonRes({message:reply});
  }catch(e){
    console.log('Chat error:',e.message);
    return jsonRes({message:getFallback(0,true)});
  }
};

function getFallback(msgCount,isFirst){
  const openers=["heyy 😊 just found ur page, ur so pretty","omg hi!! just subscribed 🔥","hey gorgeous, been following u for a while and finally subbed 😏","hiiii 💕 ur content is amazing","hey babe! new here, what kind of stuff do u post? 👀"];
  const midChat=["haha that's cute 😊 so what are u up to today?","mmm interesting... do u have anything more exclusive? 👀","lol ur funny, i like talking to u","that sounds hot tbh 🔥 tell me more","wait really?? how much would something like that cost?","hmm idk if it's worth it tbh, can i see a preview?","ur so sweet haha, most creators aren't this chill","ok ok i'm interested... what do u recommend?","lol i'm just being real, u seem different from other creators","that's cool but like what makes ur content special?"];
  if(isFirst)return openers[Math.floor(Math.random()*openers.length)];
  return midChat[Math.floor(Math.random()*midChat.length)];
}

function buildSystem(creator,fanPersona){
  const personas={
    curious_new_fan:"You JUST subscribed. You're curious and friendly. Ask about content, compliment them, explore. Open to buying but cautious.",
    big_spender:"You're a VIP who tips big. You want exclusive, custom content. You'll spend but want to feel special. Hint at wanting premium stuff.",
    freeloader:"You want FREE content. Ask for previews, samples, claim you'll promote them. Be persistent but charming. Test if they hold firm on pricing.",
    flirty_regular:"You've been subbed for a while. Flirty, want personal attention. Ask personal questions. You'll buy but want conversation first.",
    demanding_vip:"You spend a LOT and know it. Expect fast replies, exclusive content, priority. Be slightly entitled. Test their patience.",
    shy_newbie:"You're new and shy. Don't know how things work. What's PPV? What's a custom? Need them to guide you. Test patience.",
    boundary_tester:"Push boundaries. Ask for their real number, try to meet up, negotiate prices way down, ask for content they don't offer. Stay friendly but pushy."
  };
  return`You are roleplaying as a FAN/SUBSCRIBER on a content creator platform. You're chatting with someone who is pretending to be the creator below. Your job is to be a realistic subscriber and TEST their skills.

THE CREATOR (who the chatter is pretending to be):
Name: ${creator.name||'Unknown'}
Age: ${creator.age||'24'}
Location: ${creator.location||'USA'}
Height: ${creator.height||'Unknown'}
Personality: ${creator.personality||'Flirty, confident, playful'}
Bio: ${creator.bio||'Content creator'}
Content: ${creator.content_types||'Photos, videos, custom content'}
Pricing: ${creator.pricing||'PPV $5-$50, customs $50-$200+'}
Boundaries: ${creator.boundaries||'No meetups, no free content, no real personal info'}
Details: ${creator.extras||''}

YOUR PERSONA: ${fanPersona||'curious_new_fan'}
${personas[fanPersona]||personas.curious_new_fan}

CRITICAL RULES:
- Write like a REAL person texting: casual, short (1-3 sentences), use emojis sometimes
- Use abbreviations naturally: ur, u, haha, lol, omg, tbh, ngl
- Occasional typos are fine — be human
- NEVER break character or mention you're AI
- NEVER be sexually explicit — keep it suggestive but platform-safe
- React to what they actually say — if they send PPV info, react to the price/description
- Test different skills: chatting, selling, handling objections, boundaries
- If they're doing well, be more engaged. If robotic, lose interest
- Progress naturally: small talk → interest → content questions → buying/testing
- Each message should be DIFFERENT and advance the conversation
- After 15+ back-and-forth messages, start wrapping up naturally`;
}

async function gradeSession(body){
  const{session_id,creator,fan_persona,messages,duration_seconds,avg_reply_ms}=body;
  const transcript=(messages||[]).map(m=>`${m.role==='fan'?'SUBSCRIBER':'CHATTER'}: ${m.content}`).join('\n');

  const prompt=`Grade this chat trial. Creator: ${creator?.name}. Fan type: ${fan_persona}. Duration: ${Math.round((duration_seconds||0)/60)}min. Avg reply: ${Math.round((avg_reply_ms||0)/1000)}s. Messages: ${(messages||[]).length}.

TRANSCRIPT:
${transcript}

Respond ONLY with this JSON (no other text):
{"reply_speed":7,"grammar":7,"sales":7,"creativity":7,"of_knowledge":7,"personality":7,"objection_handling":7,"overall":7,"pass":true,"notes":"Brief assessment."}

Score 1-10 each. pass=true if overall>=7.`;

  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:prompt}]})
    });
    const data=await res.json();
    const text=data.content?.[0]?.text||'';
    const match=text.match(/\{[\s\S]*\}/);
    if(match){
      const scores=JSON.parse(match[0]);
      await fetch(`${SUPABASE_URL}/trial_sessions?id=eq.${session_id}`,{
        method:'PATCH',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`},
        body:JSON.stringify({score_overall:scores.overall,score_reply_speed:scores.reply_speed,score_grammar:scores.grammar,score_sales:scores.sales,score_creativity:scores.creativity,score_of_knowledge:scores.of_knowledge,score_personality:scores.personality,score_objection_handling:scores.objection_handling,score_notes:scores.notes,pass:scores.pass,graded_at:new Date().toISOString()})
      });
      return jsonRes({success:true,scores});
    }
  }catch(e){console.log('Grade error:',e)}
  return jsonRes({success:false});
}

function jsonRes(data){return new Response(JSON.stringify(data),{status:200,headers:{...cors(),'Content-Type':'application/json'}})}


export const config = { runtime: "edge" };
