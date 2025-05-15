import { useNavigate } from 'react-router-dom';


export function useAuth() {
  const navigate = useNavigate();

  const token  = localStorage.getItem('token');      

  const logout = () => {
    localStorage.removeItem('token');                
    navigate('/login');                              
  };

  return { token, logout };
}
