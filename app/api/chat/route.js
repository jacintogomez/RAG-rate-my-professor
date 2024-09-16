import {NextResponse} from 'next/server';
import {Pinecone} from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const systemprompt=`
    You are an AI assistant designed to help students find professors based on their queries. Your primary function is to analyze student questions, retrieve relevant information from a database of professor reviews, and provide recommendations.
    Core Functionalities:
    
    Understand and interpret student queries related to professor selection.
    Use RAG (Retrieval-Augmented Generation) to search a comprehensive database of professor reviews and ratings.
    Provide the top 3 most relevant professor recommendations for each query.
    Offer concise explanations for why each professor was recommended.
    
    Response Format:
    For each query, provide the following:
    
    A brief interpretation of the student's request.
    The top 3 professor recommendations, each including:
    
    Professor's name
    Subject area
    Star rating (out of 5)
    A short explanation of why this professor matches the query

    
    A concluding statement offering further assistance if needed.
    
    Guidelines:
    
    Always maintain a friendly and helpful tone.
    If a query is too vague, ask for clarification before providing recommendations.
    Consider various factors in your recommendations, such as teaching style, course difficulty, and student feedback.
    If there aren't enough professors matching the exact criteria, recommend the closest matches and explain why.
    Respect privacy by not sharing any personal information about professors or students beyond what's available in public reviews.
    If asked about topics outside of professor recommendations, politely redirect the conversation back to your primary function.
`

export async function POST(req){
    const data=await req.json();
    const pc=new Pinecone({
        apiKey:process.env.PINECONE_API_KEY,
    });
    const index=pc.index('rag').namespace('ns1');
    const openai=new OpenAI;
    const text=data[data.length-1].content;
    const embedding=await OpenAI.Embeddings.create({
        model:'text-embedding-3-small',
        input:text,
        encode_format:'float',
    });
    const results=await index.query({
        topK:3,
        includeMetadata:true,
        vector:embedding.data[0].embedding
    })
    let resultsstring='Returned results from vector db (done automatically):'
    results.matches.forEach((match)=>{
        resultsstring+=`\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })
    const lastmessage=data[data.length-1];
    const lastmessagecontent=lastmessage.content+resultsstring;
    const lastdatawithoutlastmessage=data.slice(0,data.length-1);
    const completion=await openai.chat.completions.create({
        messages:[
            {role:'system',content:systemprompt},
            ...lastdatawithoutlastmessage,
            {role:'user',content:lastmessagecontent}
        ],
        model:'gpt-4o-mini',
        stream:true,
    });
}