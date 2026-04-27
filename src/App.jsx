import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fibonacci-api-dht3.onrender.com";

const ACOES_POPULARES = [
  "PETR4","VALE3","ITUB4","BBDC4","ABEV3","WEGE3","RENT3","MGLU3",
  "BBAS3","SUZB3","RDOR3","HAPV3","PRIO3","GGBR4","BPAC11"
];

function labelDestaque(label) {
  if (label === "PP") return "pp";
  if (label.startsWith("R") && label !== "Abertura") return "r";
  if (label.startsWith("S")) return "s";
  return null;
}

export default function App() {
  const [tab, setTab] = useState("pivot");
  const [acoesSelecionadas, setAcoesSelecionadas] = useState([]);
  const [inputAcao, setInputAcao] = useState("");
  const [dia, setDia] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [erro, setErro] = useState("");
  const [tabela, setTabela] = useState(null);

  function adicionarAcao(acao) {
    const valor = acao.trim().toUpperCase();
    if (!valor) return;
    if (acoesSelecionadas.includes(valor)) return;
    setAcoesSelecionadas([...acoesSelecionadas, valor]);
    setInputAcao("");
  }

  function removerAcao(acao) {
    setAcoesSelecionadas(acoesSelecionadas.filter(a => a !== acao));
    setTabela(null);
  }

  function handleInputKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      adicionarAcao(inputAcao);
    }
  }

  function formatarDia(valor) {
    const nums = valor.replace(/\D/g, "");
    if (nums.length <= 2) return nums;
    if (nums.length <= 4) return nums.slice(0,2) + "/" + nums.slice(2);
    return nums.slice(0,2) + "/" + nums.slice(2,4) + "/" + nums.slice(4,6);
  }

  function validar() {
    if (acoesSelecionadas.length === 0) { setErro("Adicione ao menos uma ação."); return false; }
    if (dia.length < 8) { setErro("Informe a data no formato DD/MM/AA."); return false; }
    setErro("");
    return true;
  }

  async function gerarPreview() {
    if (!validar()) return;
    setLoading(true);
    setTabela(null);
    const endpoint = tab === "pivot" ? "/fibonacci/preview" : "/fibonacci-retraido/preview";
    try {
      const res = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acoes: acoesSelecionadas, dia }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro desconhecido");
      }
      setTabela(await res.json());
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function baixarPlanilha() {
    if (!validar()) return;
    setDownloading(true);
    const endpoint = tab === "pivot" ? "/fibonacci/download" : "/fibonacci-retraido/download";
    try {
      const res = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acoes: acoesSelecionadas, dia }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro desconhecido");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fibonacci_${dia.replace(/\//g, "-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8fafc", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      padding: "2rem 1rem",
      fontFamily: "Inter, system-ui, sans-serif" 
    }}>
      {/* Container Principal ULTRA WIDE */}
      <div style={{ 
        width: "95vw", // Ocupa 95% da largura da tela
        maxWidth: tabela ? "1600px" : "600px", // Aumentado para 1600px quando tem tabela
        transition: "max-width 0.4s ease-in-out" 
      }}>

        <header style={{ marginBottom: "2rem", textAlign: tabela ? "left" : "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#1e293b", letterSpacing: "-0.025em" }}>
            Fibonacci Ações
          </h1>
          <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>
            Análise técnica de suporte e resistência para ativos da B3.
          </p>
        </header>

        {/* Card de Configuração (Mesmo Layout) */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "16px", 
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          border: "1px solid #e2e8f0", 
          padding: "2rem", 
          marginBottom: "2rem" 
        }}>

          <div style={{ display: "flex", gap: 12, marginBottom: "2rem" }}>
            {["pivot", "retraido"].map(t => (
              <button key={t} onClick={() => { setTab(t); setTabela(null); }} style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                border: "none",
                background: tab === t ? "#3b82f6" : "#f1f5f9",
                color: tab === t ? "#fff" : "#64748b",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
                transition: "all 0.2s"
              }}>
                {t === "pivot" ? "Fibonacci Pivot" : "Fibonacci Retraído"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
             <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Data do Pregão</label>
                <input type="text" placeholder="DD/MM/AA" value={dia}
                  onChange={e => { setDia(formatarDia(e.target.value)); setTabela(null); }}
                  maxLength={8} style={{ 
                    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: 14 
                  }} />
             </div>
             <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Ativo Manual</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" placeholder="PETR4" value={inputAcao}
                    onChange={e => setInputAcao(e.target.value.toUpperCase())}
                    onKeyDown={handleInputKeyDown} style={{ 
                      flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: 14 
                    }} />
                  <button onClick={() => adicionarAcao(inputAcao)} style={{ 
                    padding: "0 16px", background: "#1e293b", color: "#fff", borderRadius: "8px", border: "none", fontWeight: 500, cursor: "pointer" 
                  }}>Add</button>
                </div>
             </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 10 }}>Ações Populares</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ACOES_POPULARES.map(a => {
                const s = acoesSelecionadas.includes(a);
                return (
                  <button key={a} onClick={() => s ? removerAcao(a) : adicionarAcao(a)} style={{
                    padding: "6px 12px", fontSize: 12, borderRadius: "20px",
                    border: "1px solid",
                    borderColor: s ? "#3b82f6" : "#e2e8f0",
                    background: s ? "#eff6ff" : "#fff",
                    color: s ? "#2563eb" : "#64748b",
                    cursor: "pointer", fontWeight: 500, transition: "all 0.2s"
                  }}>{a}</button>
                );
              })}
            </div>
          </div>

          {acoesSelecionadas.length > 0 && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                Selecionadas ({acoesSelecionadas.length})
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {acoesSelecionadas.map(a => (
                  <span key={a} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 10px", fontSize: 12, borderRadius: "6px",
                    background: "#fff", border: "1px solid #e2e8f0", color: "#1e293b", fontWeight: 600
                  }}>
                    {a}
                    <span onClick={() => removerAcao(a)} style={{ cursor: "pointer", color: "#ef4444", fontSize: 16 }}>&times;</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {erro && (
            <div style={{ marginBottom: "1rem", padding: "12px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c", fontSize: 13, fontWeight: 500 }}>
              ⚠️ {erro}
            </div>
          )}

          <button onClick={gerarPreview} disabled={loading} style={{
            width: "100%", padding: "14px", fontSize: 16, fontWeight: 600,
            borderRadius: "10px", border: "none",
            background: loading ? "#94a3b8" : "#2563eb",
            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.39)"
          }}>
            {loading ? "Processando..." : "Calcular Níveis Fibonacci"}
          </button>
        </div>

        {/* Tabela de Resultados Ampla Sem Scroll */}
        {tabela && (
          <div style={{ 
            background: "#fff", 
            borderRadius: "16px", 
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            border: "1px solid #e2e8f0", 
            padding: "1.5rem",
            animation: "fadeIn 0.5s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1e293b" }}>Resultados — {dia}</h3>
              </div>
              <button onClick={baixarPlanilha} disabled={downloading} style={{
                padding: "10px 20px", fontSize: 14, fontWeight: 600, borderRadius: "8px",
                border: "1px solid #e2e8f0", background: "#fff", color: "#1e293b", 
                cursor: downloading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8
              }}>
                {downloading ? "..." : "📥 Baixar Excel"}
              </button>
            </div>

            {/* Ajuste crucial aqui: eliminando overflow-x e forçando layout fixo */}
            <div style={{ 
              borderRadius: "8px", 
              border: "1px solid #e2e8f0",
              overflow: "hidden" // Esconde qualquer transbordamento indesejado
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate", 
                borderSpacing: 0, 
                fontSize: "13px", // Fonte levemente menor para caber mais
                tableLayout: "fixed" // Força as colunas a se ajustarem à largura total
              }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ 
                      textAlign: "left", padding: "12px 8px", background: "#f8fafc", 
                      borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 700,
                      width: "80px" // Largura fixa para a coluna de Níveis
                    }}>Nível</th>
                    {tabela.acoes.map(a => (
                      <th key={a} style={{ 
                        textAlign: "right", padding: "12px 4px", background: "#f8fafc", 
                        borderBottom: "2px solid #e2e8f0", color: "#1e293b", fontWeight: 700
                      }}>{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabela.labels.map((label, i) => {
                    const tipo = labelDestaque(label);
                    const rowStyles = {
                      pp: { bg: "#fef9c3", text: "#854d0e" },
                      r: { bg: "#f0fdf4", text: "#166534" },
                      s: { bg: "#fef2f2", text: "#991b1b" },
                      default: { bg: "#fff", text: "#1e293b" }
                    }[tipo || "default"];

                    return (
                      <tr key={i}>
                        <td style={{ 
                          padding: "8px 8px", borderBottom: "1px solid #f1f5f9", 
                          fontWeight: 700, background: rowStyles.bg, color: rowStyles.text,
                        }}>{label}</td>
                        {tabela.acoes.map(a => (
                          <td key={a} style={{ 
                            textAlign: "right", padding: "8px 4px", borderBottom: "1px solid #f1f5f9", 
                            fontFamily: "monospace", fontSize: "14px", background: rowStyles.bg, color: rowStyles.text,
                            whiteSpace: "nowrap" // Evita que o número quebre linha
                          }}>
                            {tabela.dados[a][i].toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13, fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#dcfce7", border: "1px solid #166534" }} /> Resistências
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#fef9c3", border: "1px solid #854d0e" }} /> Pivot
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#fef2f2", border: "1px solid #991b1b" }} /> Suportes
              </span>
            </div>
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: "2rem", paddingBottom: "2rem" }}>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            Fonte de dados: <a href="https://www.grafbolsa.net" target="_blank" rel="noreferrer" style={{ color: "#64748b", textDecoration: "underline" }}>grafbolsa.net</a>
          </p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input:focus { border-color: #3b82f6 !important; ring: 2px solid #bfdbfe; }
        tr:hover td { filter: brightness(0.98); }
      `}} />
    </div>
  );
}