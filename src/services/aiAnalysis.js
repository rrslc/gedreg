import Anthropic from "@anthropic-ai/sdk";

export async function analyzeDocument(file, apiKey) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Arquivo muito grande. Limite: 5 MB.");
  const isImage = file.type.startsWith("image/");
  const isPdf   = file.type === "application/pdf";
  if (!isImage && !isPdf) throw new Error("Formato não suportado. Use PDF ou imagem (JPG, PNG, WEBP).");

  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const fileBlock = isImage
    ? { type: "image",    source: { type: "base64", media_type: file.type,         data: base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };

  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        fileBlock,
        {
          type: "text",
          text: `Você é especialista em documentos regulatórios brasileiros para fabricantes de dispositivos médicos (ANVISA, VISA, CLF, CBPF, licenças ambientais, alvarás municipais, etc.).

Analise este documento e retorne APENAS um objeto JSON válido, sem markdown, sem blocos de código:
{
  "descricao": "nome do tipo de documento (ex: Alvará Sanitário, CLF, CBPF Classe III e IV, etc.)",
  "orgao": "órgão emissor (ex: ANVISA, VISA Municipal — Lauro de Freitas, CBMBA, etc.)",
  "dataEmissao": "AAAA-MM-DD ou null",
  "dataValidade": "AAAA-MM-DD ou null (null se validade indeterminada)",
  "legislacaoBase": "norma aplicável (ex: RDC 848/2024, CONAMA 237/1997, RDC 665/2022, etc.)",
  "prazoAntecedenciaDias": número inteiro (120 para CBPF/Alvará Sanitário/Licença Ambiental/Corpo de Bombeiros; 60 para CLF/ANVISA; 30 para alvarás municipais e demais),
  "renovacaoAutomatica": false,
  "observacao": "observações ou informações relevantes encontradas no documento",
  "checklistRenovacao": ["passo 1 para renovar este documento", "passo 2", "..."] (lista de 3 a 8 passos práticos e objetivos para renovar este tipo de documento, baseados na regulamentação brasileira vigente)
}`,
        },
      ],
    }],
  });

  let text = resp.content[0].text.trim();
  text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(text);
}
