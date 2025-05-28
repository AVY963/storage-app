import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import validator from "validator";
import { 
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Avatar,
  Grid,
  Alert,
  Snackbar,
  FormHelperText
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Функция для валидации email
  const validateEmail = (email) => {
    if (!email) {
      return "Email обязателен";
    }
    if (!validator.isEmail(email)) {
      return "Некорректный формат email";
    }
    return "";
  };

  // Функция для валидации пароля
  const validatePassword = (password) => {
    if (!password) {
      return "Пароль обязателен";
    }
    if (!validator.isLength(password, { min: 6 })) {
      return "Пароль должен содержать минимум 6 символов";
    }
    return "";
  };

  // Функция для валидации формы
  const validateForm = () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    return !emailErr && !passwordErr;
  };

  const handleLogin = async () => {
    console.log("pizda:");
    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(email, password);
      
      if (result.success) {
        navigate("/files");
      } else {
        setError(result.error);
        setOpenSnackbar(true);
      }
    } catch (err) {
      setError("Ошибка авторизации: " + err.message);
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Сначала регистрируем пользователя
      const registerResult = await register(email, password);
      
      if (registerResult.success) {
        // Если регистрация успешна, выполняем вход
        const loginResult = await login(email, password);
        
        if (loginResult.success) {
          navigate("/files");
        } else {
          setError("Регистрация успешна, но не удалось войти: " + loginResult.error);
          setOpenSnackbar(true);
        }
      } else {
        setError(registerResult.error);
        setOpenSnackbar(true);
      }
    } catch (err) {
      setError("Ошибка регистрации: " + err.message);
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(""); // Сбрасываем ошибку при изменении поля
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(""); // Сбрасываем ошибку при изменении поля
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              Вход в систему
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email адрес"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              onBlur={() => setEmailError(validateEmail(email))}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              error={!!passwordError}
              helperText={passwordError}
              onBlur={() => setPasswordError(validatePassword(password))}
              disabled={isSubmitting}
            />
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || !!emailError || !!passwordError}
                >
                  {isSubmitting ? 'Вход...' : 'Войти'}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleRegister}
                  disabled={isSubmitting || !!emailError || !!passwordError}
                >
                  {isSubmitting ? 'Обработка...' : 'Регистрация'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
          <Alert onClose={() => setOpenSnackbar(false)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}