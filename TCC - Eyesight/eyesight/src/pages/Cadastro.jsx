import { useNavigate } from "react-router-dom";

function Cadastro() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Cadastro</h2>
      <button onClick={() => navigate("/login")}>Voltar para Login</button>
    </div>
  );
}

export default Cadastro;