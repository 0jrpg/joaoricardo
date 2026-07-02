export default function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <h1>Servidor de arquivos</h1>
        <p>
          Acesse qualquer arquivo direto pela URL, por exemplo:
          <br />
          <code>seusite.vercel.app/Resumo-de-Geografia.pdf</code>
          <br />
          <code>seusite.vercel.app/site/index.html</code>
        </p>
        <p>
          Cada tipo abre do seu jeito: HTML vira página, PDF abre no leitor,
          imagem aparece, código aparece como texto. Pra ver o código-fonte de
          qualquer arquivo (mesmo um .html), acesse com <code>/raw/</code> na
          frente, ex: <code>seusite.vercel.app/raw/site/index.html</code>.
        </p>
        <p>
          Para gerenciar os arquivos, vá em <a href="/admin">/admin</a>.
        </p>
      </div>
    </div>
  );
}
