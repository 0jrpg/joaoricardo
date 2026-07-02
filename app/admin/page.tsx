"use client";

import { useEffect, useRef, useState } from "react";

type StoredFile = {
  path: string;
  size: number;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const singleFileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles(true);
  }, []);

  async function loadFiles(isInitialCheck = false) {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files);
        setLoggedIn(true);
      }
    } finally {
      setLoadingFiles(false);
      if (isInitialCheck) setCheckingSession(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLoggedIn(true);
      loadFiles();
    } else {
      setLoginError("Senha incorreta.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setLoggedIn(false);
    setPassword("");
  }

  async function uploadFileList(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => {
        // webkitRelativePath só existe quando é upload de pasta;
        // pra arquivo avulso usamos o nome direto.
        const relativePath = (file as any).webkitRelativePath || file.name;
        formData.append("file", file);
        formData.append("path", relativePath);
      });

      const res = await fetch("/api/files", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.count} arquivo(s) enviado(s) com sucesso.`);
        loadFiles();
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } finally {
      setUploading(false);
      if (singleFileInput.current) singleFileInput.current.value = "";
      if (folderInput.current) folderInput.current.value = "";
    }
  }

  async function handleDelete(path: string) {
    if (!confirm(`Apagar "${path}"?`)) return;
    const res = await fetch("/api/files/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (res.ok) {
      loadFiles();
    } else {
      const data = await res.json();
      setMessage(`Erro ao apagar: ${data.error}`);
    }
  }

  if (checkingSession) {
    return (
      <div className="container">
        <div className="card">Carregando...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card">
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Entrar</button>
          </form>
          {loginError && <p style={{ color: "#ff6b6b" }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Admin</h1>
          <button onClick={handleLogout}>Sair</button>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
          <div>
            <label style={{ display: "block", fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
              Um ou mais arquivos
            </label>
            <input
              ref={singleFileInput}
              type="file"
              multiple
              disabled={uploading}
              onChange={(e) => uploadFileList(e.target.files)}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
              Pasta inteira (mantém a estrutura — ideal pra site com index.html + css + js)
            </label>
            <input
              ref={folderInput}
              type="file"
              disabled={uploading}
              // @ts-ignore - atributo não tipado, mas suportado pelos navegadores
              webkitdirectory=""
              directory=""
              multiple
              onChange={(e) => uploadFileList(e.target.files)}
            />
          </div>
        </div>
        {uploading && <p>Enviando...</p>}
        {message && <p>{message}</p>}
      </div>

      <div className="card">
        <h2>Arquivos</h2>
        {loadingFiles && <p>Carregando lista...</p>}
        {!loadingFiles && files.length === 0 && <p>Nenhum arquivo enviado ainda.</p>}
        {files.map((f) => (
          <div className="file-row" key={f.path}>
            <div>
              <a href={`/${f.path}`} target="_blank" rel="noreferrer">
                {f.path}
              </a>
              {" · "}
              <a href={`/raw/${f.path}`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                ver código
              </a>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{(f.size / 1024).toFixed(0)} KB</div>
            </div>
            <button className="danger" onClick={() => handleDelete(f.path)}>
              Apagar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
