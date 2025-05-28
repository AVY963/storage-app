import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon, 
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  AppBar,
  Toolbar,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

export default function FilesPage() {
  const { accessToken, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileDetails, setFileDetails] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8081/api/files/list", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        console.error("Ошибка при получении списка файлов", res.status);
        setFiles([]);
        showAlert("Не удалось загрузить список файлов", "error");
        return;
      }

      try {
        const data = await res.json();
        let filesList = [];
        
        if (data && Array.isArray(data)) {
          filesList = data.filter(item => item && typeof item === 'string');
        } else if (data && data.files && Array.isArray(data.files)) {
          filesList = data.files.filter(item => item && typeof item === 'string');
        } else {
          console.warn("Сервер вернул неверный формат данных:", data);
        }
        
        setFiles(filesList);
        
        // Получаем детали для каждого файла
        filesList.forEach(fileName => {
          getFileDetails(fileName);
        });
      } catch (err) {
        console.error("Ошибка при обработке JSON:", err);
        setFiles([]);
        showAlert("Ошибка при обработке ответа сервера", "error");
      }
    } catch (err) {
      console.error("Ошибка сети:", err);
      setFiles([]);
      showAlert("Ошибка при загрузке файлов", "error");
    } finally {
      setLoading(false);
    }
  };

  const getFileDetails = async (fileName) => {
    if (!fileName || typeof fileName !== 'string') {
      console.error("Неверное имя файла:", fileName);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8081/api/files/info/${encodeURIComponent(fileName)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (res.ok) {
        const details = await res.json();
        setFileDetails(prev => ({
          ...prev,
          [fileName]: details
        }));
      } else {
        console.warn(`Не удалось получить данные для файла ${fileName}, статус: ${res.status}`);
      }
    } catch (err) {
      console.error("Ошибка при получении информации о файле:", err);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const upload = async () => {
    if (!selectedFile) {
      showAlert("Пожалуйста, выберите файл для загрузки", "warning");
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:8081/api/files/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          showAlert("Файл успешно загружен", "success");
          setSelectedFile(null);
          fetchFiles();
        } else {
          let errorMessage = "Ошибка при загрузке файла";
          try {
            const errorData = JSON.parse(xhr.responseText);
            if (errorData && errorData.message) {
              errorMessage = `Ошибка: ${errorData.message}`;
            }
          } catch (e) {
            // Если ответ не в формате JSON, используем стандартное сообщение
          }
          showAlert(`${errorMessage} (${xhr.status})`, "error");
        }
        setUploading(false);
      };
      
      xhr.onerror = () => {
        showAlert("Ошибка соединения с сервером", "error");
        setUploading(false);
      };
      
      xhr.send(formData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      showAlert(`Не удалось загрузить файл: ${err.message || 'Неизвестная ошибка'}`, "error");
      setUploading(false);
    }
  };

  const download = async (filename) => {
    if (!filename || typeof filename !== 'string') {
      console.error("Неверное имя файла для скачивания:", filename);
      showAlert("Ошибка при скачивании файла", "error");
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8081/api/files/download/${encodeURIComponent(filename)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!res.ok) {
        showAlert(`Ошибка при скачивании файла: ${res.status}`, "error");
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showAlert("Файл скачан", "success");
    } catch (err) {
      console.error("Ошибка при скачивании:", err);
      showAlert("Не удалось скачать файл", "error");
    }
  };

  const confirmDelete = (filename) => {
    if (!filename || typeof filename !== 'string') {
      console.error("Неверное имя файла для удаления:", filename);
      showAlert("Ошибка при подготовке к удалению файла", "error");
      return;
    }
    setFileToDelete(filename);
    setDeleteDialogOpen(true);
  };

  const remove = async () => {
    if (!fileToDelete) return;
    
    try {
      const res = await fetch(`http://localhost:8081/api/files/delete/${encodeURIComponent(fileToDelete)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (res.ok) {
        showAlert("Файл успешно удален", "success");
      } else {
        showAlert(`Не удалось удалить файл: ${res.status}`, "error");
      }
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      showAlert("Ошибка при удалении файла", "error");
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      fetchFiles();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const closeAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  useEffect(() => {
    fetchFiles();
    
    // Обработчик для периодического обновления списка файлов
    const interval = setInterval(() => {
      if (!uploading && !deleteDialogOpen) {
        fetchFiles();
      }
    }, 30000); // Обновление каждые 30 секунд
    
    return () => clearInterval(interval);
  }, [uploading, deleteDialogOpen]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Файловый менеджер
          </Typography>
          <Tooltip title="Обновить">
            <IconButton color="inherit" onClick={fetchFiles}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Выйти">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Container sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Загрузка файла
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mr: 2 }}
                  >
                    Выберите файл
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  <Typography variant="body2">
                    {selectedFile ? selectedFile.name : 'Файл не выбран'}
                  </Typography>
                </Box>
                
                {uploading && (
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                      {`${uploadProgress}%`}
                    </Typography>
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  onClick={upload}
                  disabled={!selectedFile || uploading}
                >
                  Загрузить
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Список файлов
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {files.length === 0 ? (
                    <Typography variant="body1" align="center" sx={{ p: 3 }}>
                      Файлы отсутствуют
                    </Typography>
                  ) : (
                    <List>
                      {files.map((name, index) => (
                        name && typeof name === 'string' ? (
                          <React.Fragment key={name || index}>
                            {index > 0 && <Divider />}
                            <ListItem>
                              <ListItemIcon>
                                <FileIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={name}
                                secondary={
                                  fileDetails && fileDetails[name] ? (
                                    <>
                                      <Typography variant="body2" component="span">
                                        Размер: {formatFileSize(fileDetails[name].size)}
                                      </Typography>
                                      <br />
                                      <Typography variant="body2" component="span">
                                        Дата загрузки: {formatDate(fileDetails[name].uploaded_at)}
                                      </Typography>
                                    </>
                                  ) : (
                                    <Typography variant="body2" component="span">
                                      Файл в хранилище
                                    </Typography>
                                  )
                                }
                              />
                              <ListItemSecondaryAction>
                                <Tooltip title="Скачать">
                                  <IconButton edge="end" onClick={() => download(name)} color="primary">
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Удалить">
                                  <IconButton edge="end" onClick={() => confirmDelete(name)} color="error">
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          </React.Fragment>
                        ) : null
                      ))}
                    </List>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить файл "{fileToDelete}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Отмена
          </Button>
          <Button onClick={remove} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Уведомления */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={closeAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
