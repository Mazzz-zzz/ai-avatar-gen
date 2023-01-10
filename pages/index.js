import Head from 'next/head';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';

const Home = () => {
  const maxRetries = 20;
  const [input, setInput] = useState('');
  const [img, setImg] = useState(''); 
  // Numbers of retries 
  const [retry, setRetry] = useState(0);
  // Number of retries left
  const [retryCount, setRetryCount] = useState(maxRetries);
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');

  const onChange = (e) => { 
    setInput(e.target.value);
  };
  const generateAction = async () => {
    console.log('Generating...');	
    setIsGenerating(true);

    if (isGenerating && retry === 0) return;

    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setRetry(0);
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();
    if (response.status === 503) {
      console.log('Model is loading still :(.')
      setRetry(data.estimated_time);
      return;
    }

    // If another error, drop error
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      setIsGenerating(false);
      return;
    }
    setFinalPrompt(input);

    setImg(data.image);
    setIsGenerating(false);
  } 
  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
        setRetryCount(maxRetries);
        return;
        }

      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  return (
    <div className="root">
      <Head>
        <title>Mazzz Avatar generator | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>turn me into anything you want</h1>
          </div>
          <div className="header-subtitle">
            <h2>Generates AI images and portraits of me. Refer to me as "Almaz".</h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} />
            {/* Add your prompt button in the prompt container */}
            <div className="prompt-buttons" >
              <a className={isGenerating ? 'generate-button loading' : 'generate-button'} onClick={generateAction}>
                <div  className="generate">
                  {isGenerating ? (<span className="loader"></span>) : (<p>Generate</p>)}
                </div>
              </a>
            </div>
          </div>
        </div>
      {/* Add output container */}
      {img && (
      <div className="output-content">
        <Image src={img} width={512} height={512} alt={input} />
        <p>{finalPrompt}</p>
      </div>
      )}
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;
