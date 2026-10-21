import { Icon } from '../ui/Icon';

const questions = [
  { id: 'sobre', question: 'Sobre o projeto', answer: 'Portal público da proposta do Dossiê da Mulher Itaquaquecetubense, com foco na violência contra a mulher e na rede de proteção. Os temas e indicadores dependem da validação das bases oficiais.' },
  { id: 'fontes', question: 'Fontes e metodologia', answer: 'As bases oficiais ainda serão definidas pela equipe. Cada indicador deverá informar fonte, período, unidade de medida e critérios de cálculo.' },
  { id: 'atualizacao', question: 'Atualização dos dados', answer: 'A atualização será configurada no Power BI conforme a fonte de origem. Não significa atualização em tempo real.' },
  { id: 'privacidade', question: 'Privacidade e interpretação', answer: 'A proposta é publicar dados agregados, sem identificação de pessoas. Ao comparar períodos ou territórios, considere população, cobertura e diferenças de registro. Mais registros não significam, necessariamente, mais ocorrências.' },
];

export function MethodologySection() {
  return (
    <section id="metodologia" className="section methodology-section" aria-labelledby="methodology-title">
      <div className="container methodology-layout">
        <div className="methodology-intro"><p className="eyebrow">TRANSPARÊNCIA</p><h2 id="methodology-title">Sobre os dados</h2><p>Fontes, atualização e critérios de leitura.</p></div>
        <div className="faq">
          {questions.map(item => (
            <details id={item.id} key={item.id} data-reveal>
              <summary>{item.question}<Icon name="chevron" size={18} /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

