'use client';
import '../../styles/main.css';
import './colors.css';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="samurai-container">
      <div className="village-background" style={{alignContent: "center", display: "flex", flexDirection: "column"}}>
        <div className="hero-title">
          Welcome to SamurAI
        </div>

        <div style={{textAlign: "center", marginTop: "20%", fontSize: "50px", color: "var(--text-light)"}}>
          <button 
            style={{
              backgroundColor: "var(--primary-blue)", 
              padding: "16px 32px",
              borderRadius: "8px",
              color: "white",
              fontSize: "24px",
              fontWeight: "bold",
              border: "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderBottom: "3px solid var(--navy-blue)"
            }}
            onClick={() => router.push('/dashboard')}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--light-blue)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-blue)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Enter SamurAI World
          </button>
        </div>
      </div>
    </div>
  );
}
