'use client'
import {useState} from "react";
import {Box, Button, Stack, TextField} from "@mui/material";
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages,setmessages]=useState([
    {
      role:'assistant',
      content:"Hi, I'm the Rate My Professor support assistant. How can I help you?",
    }
  ]);
  const [message,setmessage]=useState('');
  const sendmessage=async ()=>{
    setmessages((messages)=>[
      ...messages,
      {role:'user',content:message},
      {role:'assistant',content:''},
    ]);
    setmessage('');
    const response=fetch('/api/chat',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
      },
      body:JSON.stringify([...messages,{role:'user',content:message}]),
    }).then(async (res)=>{
      const reader=res.body.getReader();
      const decoder=new TextDecoder();
      let result='';
      return reader.read().then(function processtext({done,value}){
        if(done){return result;}
        const text=decoder.decode(value||new Uint8Array(),{stream:true});
        setmessages((messages)=>{
          let lastmessage=messages[messages.length-1];
          let othermessages=messages.slice(0,messages.length-1);
          return [
            ...othermessages,
            {...lastmessage,content:lastmessage.content+text},
          ]
        });
        return reader.read().then(processtext);
      });
    });
  }
  return (
      <Box width='100vw' height='100vh' display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
        <Stack direction='column' width='500px' height='700px' border='1px solid black' padding={2} spacing={3}>
          <Stack direction='column' spacing={2} flexGrow={1} overflow='auto' maxHeight='100%'>
            {messages.map((message,index)=>(
              <Box key={index} display='flex' justifyContent={message.role==='assistant'?'flex-start':'flex-end'}>
                <Box bgcolor={message.role==='assistant'?'primary.main':'secondary.main'} color='white' borderRadius={16} p={3}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction='row' spacing={2}>
            <TextField label='Message' fullWidth value={message} onChange={(e)=>{setmessage(e.target.value)}}></TextField>
            <Button variant='contained' onClick={sendmessage}>Send</Button>
          </Stack>
        </Stack>
      </Box>
  );
}
