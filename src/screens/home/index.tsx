import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';


interface GeneratedResult {
    expression: string;
    answer: number;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [result, setResult] = useState<GeneratedResult>();
    const SWATCHES = ['#2e2e2e', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14'];

    // useEffect(() => {
    //     if (!isDrawing) {
    //         runRoute();
    //     }
    // }, [isDrawing]);


    useEffect(() => {
        // Load MathJax
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);


    useEffect(() => {
        if (result) {
            const latexExpression = `$$${result.expression} = ${result.answer}$$`;
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (canvas && overlayCanvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
            
            // Match the overlay canvas size and position with the main canvas
            overlayCanvas.width = canvas.width;
            overlayCanvas.height = canvas.height;
            overlayCanvas.style.position = 'absolute';
            overlayCanvas.style.left = `${canvas.offsetLeft}px`;
            overlayCanvas.style.top = `${canvas.offsetTop}px`;
            overlayCanvas.style.pointerEvents = 'none'; // Make it non-interactive
        }
    }, []);

    const renderLatexToCanvas = (expression: string, answer: number) => {
        const overlayCanvas = overlayCanvasRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas!.getContext('2d');
        if (canvas) {
            if (ctx) {
                ctx.clearRect(0, 0, canvas!.width, canvas!.height);
            }
        }
        if (overlayCanvas) {
            const ctx = overlayCanvas.getContext('2d');
            if (ctx) {
                // Clear the canvas
                
                // Set up the canvas for text rendering
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                
                // Render the expression and answer
                const latex = `${expression} = ${answer}`;
                ctx.fillText(latex, 10, 200);

                // Use MathJax to render the LaTeX
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, overlayCanvas]);
            }
        }
    };
    
    const resetCanvas = () => {
        const canvas = canvasRef.current;
        // const overlayCanvas = overlayCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        };
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/run`,
                data: {
                    image: canvas.toDataURL('image/png')
                }
            });
    
            const resp = await response.data;
            console.log('Settting result', resp.data);
            setResult({
                expression: resp.data.result,
                answer: resp.data.answer
            })
            console.log('Set result', result);
        }
    };
    
    return (
        <>
            <div className='grid grid-cols-3 gap-2'>
                <Button
                    onClick={() => setReset(true)}
                    className='z-20 bg-black text-white'
                    variant='default' 
                    color='white'
                >
                    Reset
                </Button>
                <Group className='z-20'>
                    {SWATCHES.map((swatch) => (
                        <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
                    ))}
                </Group>
                <Button
                    onClick={runRoute}
                    className='z-20 bg-black text-white'
                    variant='default'
                    color='white'
                >
                    Run
                </Button>
            </div>
            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-0 left-0 w-full h-full'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />
            <canvas
                ref={overlayCanvasRef}
                id='overlayCanvas'
                className='absolute top-0 left-0 w-full h-full pointer-events-none'
            />
        </>
    );
}
