'use client';
import '../../styles/main.css';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="samurai-container">
      <div className="village-background" style={{alignContent: "center", display: "flex", flexDirection: "column"}}>
        <div className="hero-title">
          Welcome stranger
        </div>

        <div style={{textAlign: "center", marginTop: "20%", fontSize: "50px", color: "white"}}>
          <button 
            style={{backgroundColor: "black", padding: "10px"}}
            onClick={() => router.push('/dashboard')}
          >
            Enter SamurAI world
          </button>
        </div>
      </div>
    </div>
  );
}
