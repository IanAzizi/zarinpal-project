import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Container, Box, Typography, TextField, Button, CircularProgress,
    Alert, Grid, Card, CardContent, Divider, Select, MenuItem,
    FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
    DialogActions, Checkbox, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, InputAdornment,
    ThemeProvider, createTheme, Snackbar, Fade
} from '@mui/material';
import { Logout as LogoutIcon, AddCircleOutline as AddIcon, Send as SendIcon, Store as StoreIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';


// --- Global Configuration ---
const BASE_API_URL = 'http://localhost:3009/api';
const FRONTEND_BASE_URL = 'http://localhost:3001';

// --- Utility Functions ---
const toEnglishDigits = (str) => {
    if (!str) return '';
    return str.toString().replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
};

const formatNumberWithCommas = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const numberToPersianWords = (num) => {
    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const bigs = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];
    if (num === 0) return 'صفر';
    const numStr = String(num);
    const parts = [];
    const convertThreeDigits = (n) => {
        let result = [];
        let h = Math.floor(n / 100);
        let t = n % 100;
        if (h > 0) result.push(hundreds[h]);
        if (t > 0) {
            if (h > 0) result.push('و');
            if (t < 10) {
                result.push(units[t]);
            } else if (t >= 10 && t <= 19) {
                result.push(teens[t - 10]);
            } else {
                let u = t % 10;
                let ten = Math.floor(t / 10);
                result.push(tens[ten]);
                if (u > 0) {
                    result.push('و');
                    result.push(units[u]);
                }
            }
        }
        return result.join(' ');
    };
    const chunks = [];
    for (let i = numStr.length; i > 0; i -= 3) {
        chunks.push(numStr.substring(Math.max(0, i - 3), i));
    }
    chunks.forEach((chunkStr, index) => {
        const chunkNum = parseInt(chunkStr, 10);
        if (chunkNum === 0) return;
        const words = convertThreeDigits(chunkNum);
        const bigWord = bigs[index];
        if (words) {
            if (parts.length > 0) parts.unshift('و');
            parts.unshift(words);
            if (bigWord) parts.unshift(bigWord);
        }
    });
    return parts.join(' ').trim();
};

// --- Custom Input Component ---
const AmountInput = ({ label, value, onChange, disabled = false, required = false, helperText = '' }) => {
    const rawValue = useMemo(() => toEnglishDigits(String(value || '').replace(/,/g, '')), [value]);
    const formattedValue = useMemo(() => formatNumberWithCommas(rawValue), [rawValue]);
    const valueInWords = useMemo(() => {
        const num = parseInt(rawValue, 10);
        return num > 0 && !isNaN(num) ? numberToPersianWords(num) + ' تومان' : '';
    }, [rawValue]);

    const handleInputChange = (event) => {
        const input = event.target.value.replace(/,/g, '');
        const numericInput = input.replace(/[^0-9]/g, '');
        onChange(numericInput);
    };

    return (
        <FormControl fullWidth margin="normal" variant="outlined" required={required} disabled={disabled}>
            <TextField
                label={label}
                value={formattedValue}
                onChange={handleInputChange}
                disabled={disabled}
                required={required}
                dir="ltr"
                inputProps={{ style: { textAlign: 'left' } }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">تومان</InputAdornment>,
                }}
                helperText={valueInWords || helperText}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
        </FormControl>
    );
};

// --- Custom Theme ---
const theme = createTheme({
    direction: 'rtl',
    typography: {
        fontFamily: 'doran',
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
                @font-face {
                    font-family: 'doran';
                    font-style: normal;
                    font-display: swap;
                    font-weight: 400;
                    src: url('DORANFANUM-REGULAR.TTF') format('TTF');
                }
                body {
                    direction: rtl;
                    background: linear-gradient(135deg, #e6f0fa 0%, #ffffff 100%);
                }
            `,
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontWeight: 600,
                },
            },
        },
    },
    palette: {
        primary: {
            main: '#0288d1',
            light: '#4fc3f7',
            dark: '#01579b',
        },
        secondary: {
            main: '#ff6d00',
            light: '#ff9e40',
            dark: '#c43c00',
        },
        background: {
            default: '#f4f6f8',
        },
    },
});

// --- React Components ---
const AuthContext = React.createContext(null);

const useApi = () => {
    const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
    const apiFetch = useCallback(async (endpoint, options = {}) => {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        const url = `${BASE_API_URL}${endpoint}`;
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            if (response.status === 401) {
                setToken(null);
                localStorage.removeItem('jwtToken');
                window.location.hash = '/';
                return null;
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `API Error: ${response.status}`);
                }
                return data;
            } else {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Server returned non-JSON error: ${response.status} - ${text.substring(0, 50)}...`);
                }
                return await response.text();
            }
        } catch (error) {
            console.error("API error:", error.message);
            throw error;
        }
    }, [token]);
    return { token, setToken, apiFetch };
};

const AuthProvider = ({ children }) => {
    const { token, setToken, apiFetch } = useApi();
    const login = useCallback(async (email, password) => {
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data && data.token) {
                localStorage.setItem('jwtToken', data.token);
                setToken(data.token);
                return data.user;
            } else {
                throw new Error(data?.message || "پاسخ نامعتبر از سرور");
            }
        } catch (error) {
            console.error("Login error:", error.message);
            throw new Error(error.message || 'خطا در ورود به سیستم.');
        }
    }, [apiFetch, setToken]);

    const logout = useCallback(() => {
        localStorage.removeItem('jwtToken');
        setToken(null);
        window.location.hash = '/';
    }, [setToken]);

    return (
        <AuthContext.Provider value={{ token, login, logout, apiFetch }}>
            {children}
        </AuthContext.Provider>
    );
};

const LoginPage = () => {
    const { login, token } = React.useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            window.location.hash = '/dashboard';
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('لطفاً ایمیل و رمز عبور را وارد کنید.');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            window.location.hash = '/dashboard';
        } catch (err) {
            setError(err.message || 'خطا در ورود. اطلاعات را بررسی کنید.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card sx={{ p: 4, borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)' }}>
                    <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700, color: '#0288d1' }}>
                        سامانه مدیریت شارژ
                    </Typography>
                    <Divider sx={{ my: 2, backgroundColor: '#0288d1' }} />
                    <form onSubmit={handleSubmit}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="ایمیل"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            dir="ltr"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="رمز عبور"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            dir="ltr"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>{error}</Alert>}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, mb: 2, height: 48, borderRadius: '12px' }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'ورود'}
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </Container>
    );
};

const Header = ({ title }) => {
    const { logout } = React.useContext(AuthContext);
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                background: 'linear-gradient(90deg, #0288d1 0%, #4fc3f7 100%)',
                borderRadius: '12px',
                mb: 3,
                color: '#fff',
            }}
        >
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>
            <Button
                variant="contained"
                color="secondary"
                onClick={logout}
                startIcon={<LogoutIcon />}
                sx={{ borderRadius: '12px', backgroundColor: '#ff6d00', '&:hover': { backgroundColor: '#c43c00' } }}
            >
                خروج
            </Button>
        </Box>
    );
};

const UnitCreator = ({ onUnitCreated }) => {
    const { apiFetch } = React.useContext(AuthContext);
    const [name, setName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !ownerName) {
            setError('نام واحد و نام مالک الزامی است.');
            return;
        }
        setLoading(true);
        try {
            const newUnit = await apiFetch('/unites', {
                method: 'POST',
                body: JSON.stringify({ name, ownerName, address }),
            });
            if (newUnit) {
                onUnitCreated(newUnit.unit);
                setName('');
                setOwnerName('');
                setAddress('');
                setError('واحد با موفقیت ایجاد شد.');
            }
        } catch (err) {
            setError(err.message || 'خطا در ایجاد واحد.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0288d1' }}>
                    <StoreIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> ایجاد واحد جدید
                </Typography>
                <Divider sx={{ my: 2 }} />
                <form onSubmit={handleCreateUnit}>
                    <TextField
                        label="نام واحد (مثلاً: A-101)"
                        fullWidth
                        required
                        margin="normal"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    <TextField
                        label="نام مالک"
                        fullWidth
                        required
                        margin="normal"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    <TextField
                        label="پلاک"
                        fullWidth
                        margin="normal"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    {error && (
                        <Alert severity={error.startsWith('واحد') ? "success" : "error"} sx={{ mt: 2, borderRadius: '12px' }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, borderRadius: '12px' }}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                    >
                        ایجاد واحد
                    </Button>
                </form>
            </Card>
        </motion.div>
    );
};

const BillingManager = ({ unit, onBillingAdded }) => {
    const { apiFetch } = React.useContext(AuthContext);
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const currentGregorianYear = new Date().getFullYear();
    const currentPersianYear = currentGregorianYear - 621;
    const availableYears = [currentPersianYear, currentPersianYear + 1, currentPersianYear + 2];
    const months = [
        { value: '01', label: 'فروردین' }, { value: '02', label: 'اردیبهشت' }, { value: '03', label: 'خرداد' },
        { value: '04', label: 'تیر' }, { value: '05', label: 'مرداد' }, { value: '06', label: 'شهریور' },
        { value: '07', label: 'مهر' }, { value: '08', label: 'آبان' }, { value: '09', label: 'آذر' },
        { value: '10', label: 'دی' }, { value: '11', label: 'بهمن' }, { value: '12', label: 'اسفند' },
    ];

    useEffect(() => {
        const today = new Date();
        setYear(String(currentPersianYear));
        setMonth(String(today.getMonth() + 1).padStart(2, '0'));
    }, [currentPersianYear]);

    const handleAddBilling = async (e) => {
        e.preventDefault();
        setError('');
        const amountValue = parseInt(amount, 10);
        if (!month || !year || isNaN(amountValue) || amountValue <= 0) {
            setError('لطفاً ماه، سال و مبلغ شارژ را به درستی وارد کنید.');
            return;
        }
        const billingMonth = `${year}-${month}`;
        setLoading(true);
        try {
            const updatedUnit = await apiFetch(`/unites/${unit._id}/months`, {
                method: 'POST',
                body: JSON.stringify({
                    months: [{ month: billingMonth, amount: amountValue }],
                }),
            });
            if (updatedUnit) {
                onBillingAdded(updatedUnit.unit);
                setAmount('');
                setError('بدهی ماهانه با موفقیت ثبت شد.');
            }
        } catch (err) {
            setError(err.message || 'خطا در ثبت بدهی.');
        } finally {
            setLoading(false);
        }
    };

    if (!unit) return <Alert severity="info" sx={{ borderRadius: '12px' }}>واحدی را از لیست انتخاب کنید.</Alert>;

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0288d1' }}>
                    مدیریت بدهی ماهانه ({unit.name})
                </Typography>
                <Divider sx={{ my: 2 }} />
                <form onSubmit={handleAddBilling}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>سال (شمسی)</InputLabel>
                                <Select
                                    value={year}
                                    label="سال (شمسی)"
                                    onChange={(e) => setYear(e.target.value)}
                                    sx={{ borderRadius: '12px' }}
                                >
                                    {availableYears.map(y => (
                                        <MenuItem key={y} value={y}>{y}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>ماه</InputLabel>
                                <Select
                                    value={month}
                                    label="ماه"
                                    onChange={(e) => setMonth(e.target.value)}
                                    sx={{ borderRadius: '12px' }}
                                >
                                    {months.map(m => (
                                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <AmountInput
                        label="مبلغ شارژ (تومان)"
                        value={amount}
                        onChange={setAmount}
                        required
                        helperText="مبلغ را به تومان وارد کنید"
                    />
                    {error && (
                        <Alert severity={error.startsWith('بدهی') ? "success" : "error"} sx={{ mt: 2, borderRadius: '12px' }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="secondary"
                        sx={{ mt: 3, borderRadius: '12px' }}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                    >
                        ثبت بدهی ماهانه
                    </Button>
                </form>
            </Card>
        </motion.div>
    );
};

const UnitList = ({ units, onSelectUnit }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0288d1' }}>
                    <StoreIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> لیست واحدها
                </Typography>
                <Divider sx={{ my: 2 }} />
                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                <TableCell>نام واحد</TableCell>
                                <TableCell>مالک</TableCell>
                                <TableCell align="center">لینک پرداخت</TableCell>
                                <TableCell align="center">عملیات</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {units.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">هنوز واحدی ثبت نشده است.</TableCell>
                                </TableRow>
                            ) : (
                                units.map((unit) => (
                                    <TableRow key={unit._id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                        <TableCell>{unit.name}</TableCell>
                                        <TableCell>{unit.ownerName}</TableCell>
                                        <TableCell align="center">
                                            <a
                                                href={`${FRONTEND_BASE_URL}/#/pay/${unit._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.8rem', color: '#0288d1' }}
                                            >
                                                لینک پرداخت واحد
                                            </a>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                onClick={() => onSelectUnit(unit)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ borderRadius: '8px' }}
                                            >
                                                مدیریت
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </motion.div>
    );
};

const DashboardStats = ({ units }) => {
    const totalDebt = useMemo(() => {
        return units.reduce((sum, unit) => {
            return sum + unit.billingMonths.reduce((monthSum, bill) => monthSum + bill.remaining, 0);
        }, 0);
    }, [units]);

    const totalPaid = useMemo(() => {
        return units.reduce((sum, unit) => {
            return sum + unit.billingMonths.reduce((monthSum, bill) => monthSum + (bill.amount - bill.remaining), 0);
        }, 0);
    }, [units]);

    const debtorUnitsCount = useMemo(() => {
        return units.filter(unit => {
            const unitDebt = unit.billingMonths.reduce((sum, bill) => sum + bill.remaining, 0);
            return unitDebt > 0;
        }).length;
    }, [units]);

    const totalUnits = units.length;
    const paidUnitsCount = totalUnits - debtorUnitsCount;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, background: 'linear-gradient(135deg, #fff 0%, #ffebee 100%)' }}>
                        <Typography variant="h6" color="textSecondary">مجموعه طلب</Typography>
                        <Typography variant="h4" color="error">{formatNumberWithCommas(totalDebt)} تومان</Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, background: 'linear-gradient(135deg, #fff 0%, #e8f5e9 100%)' }}>
                        <Typography variant="h6" color="textSecondary">کل پرداخت شده</Typography>
                        <Typography variant="h4" color="success">{formatNumberWithCommas(totalPaid)} تومان</Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, background: 'linear-gradient(135deg, #fff 0%, #e3f2fd 100%)' }}>
                        <Typography variant="h6" color="textSecondary">تعداد واحدهای بدهکار</Typography>
                        <Typography variant="h4">{debtorUnitsCount}</Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, background: 'linear-gradient(135deg, #fff 0%, #fff3e0 100%)' }}>
                        <Typography variant="h6" color="textSecondary">تعداد واحدهای تسویه شده</Typography>
                        <Typography variant="h4">{paidUnitsCount}</Typography>
                    </Card>
                </Grid>
            </Grid>
        </motion.div>
    );
};

const ManagerDashboard = () => {
    const { apiFetch } = React.useContext(AuthContext);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(() => {
        const savedUnit = localStorage.getItem('selectedUnit');
        return savedUnit ? JSON.parse(savedUnit) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (selectedUnit) {
            localStorage.setItem('selectedUnit', JSON.stringify(selectedUnit));
        } else {
            localStorage.removeItem('selectedUnit');
        }
    }, [selectedUnit]);

    const fetchUnits = useCallback(async () => {
        if (!isMounted.current) return;
        setLoading(true);
        try {
            const data = await apiFetch('/unites');
            if (isMounted.current && data && Array.isArray(data.units)) {
                setUnits(data.units);
                if (selectedUnit) {
                    const updatedUnit = data.units.find(u => u._id === selectedUnit._id);
                    if (updatedUnit) setSelectedUnit(updatedUnit);
                }
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err.message || 'خطا در دریافت لیست واحدها');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [apiFetch]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleUnitCreated = (newUnit) => {
        setUnits(prev => [...prev, newUnit]);
        setSelectedUnit(newUnit);
    };

    const handleBillingAdded = (updatedUnit) => {
        setUnits(prev => prev.map(u => u._id === updatedUnit._id ? updatedUnit : u));
        setSelectedUnit(updatedUnit);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Header title="داشبورد مدیریت شارژ بندرعباس مال" />
            <Fade in={loading}>
                <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
                    <CircularProgress />
                </Box>
            </Fade>
            {error && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>
                    {error}
                </Alert>
            )}
            <DashboardStats units={units} />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <UnitCreator onUnitCreated={handleUnitCreated} />
                </Grid>
                <Grid item xs={12} md={8}>
                    <UnitList units={units} onSelectUnit={setSelectedUnit} />
                </Grid>
                <Grid item xs={12}>
                    <BillingManager unit={selectedUnit} onBillingAdded={handleBillingAdded} />
                </Grid>
            </Grid>
        </Container>
    );
};

const ConfirmationModal = ({ open, totalAmount, paymentAmount, onConfirm, onCancel }) => {
    const amountInWords = numberToPersianWords(paymentAmount) || 'صفر';
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', color: '#dc3545' }}>
                هشدار: مبلغ پرداختی کمتر از بدهی کل
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body1" gutterBottom>
                    شما قصد دارید مبلغی کمتر از کل بدهی انتخاب شده را پرداخت کنید:
                </Typography>
                <Box mt={2}>
                    <Typography color="textSecondary">جمع کل بدهی انتخابی:</Typography>
                    <Typography variant="h6" color="primary">{formatNumberWithCommas(totalAmount)} تومان</Typography>
                    <Typography color="textSecondary" sx={{ mt: 1 }}>مبلغ پرداختی شما:</Typography>
                    <Typography variant="h6" sx={{ color: '#dc3545' }}>{formatNumberWithCommas(paymentAmount)} تومان</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        ({amountInWords} تومان)
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    آیا از پرداخت این مبلغ ({formatNumberWithCommas(paymentAmount)} تومان) اطمینان دارید؟ مابقی بدهی برای شما باقی خواهد ماند.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="secondary" variant="outlined" sx={{ borderRadius: '8px' }}>
                    تغییر مبلغ
                </Button>
                <Button onClick={onConfirm} color="primary" variant="contained" sx={{ borderRadius: '8px' }} autoFocus>
                    تأیید و پرداخت
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const PaymentPage = () => {
    const { apiFetch } = React.useContext(AuthContext);
    const [unit, setUnit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBillIds, setSelectedBillIds] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const isMounted = useRef(false);

    const months = [
        { value: '01', label: 'فروردین' }, { value: '02', label: 'اردیبهشت' }, { value: '03', label: 'خرداد' },
        { value: '04', label: 'تیر' }, { value: '05', label: 'مرداد' }, { value: '06', label: 'شهریور' },
        { value: '07', label: 'مهر' }, { value: '08', label: 'آبان' }, { value: '09', label: 'آذر' },
        { value: '10', label: 'دی' }, { value: '11', label: 'بهمن' }, { value: '12', label: 'اسفند' },
    ];

    const unitId = window.location.hash.split('/').pop();
    const allBills = unit ? unit.billingMonths || [] : [];
    const unpaidBills = allBills.filter(bill => bill.remaining > 0);
    const selectedBills = unpaidBills.filter(bill => selectedBillIds.includes(bill._id));
    const totalSelectedAmount = selectedBills.reduce((sum, bill) => sum + bill.remaining, 0);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (parseInt(paymentAmount, 10) === 0 || paymentAmount === totalSelectedAmount) {
            setPaymentAmount(String(totalSelectedAmount));
        } else if (totalSelectedAmount < parseInt(paymentAmount, 10)) {
            setPaymentAmount(String(totalSelectedAmount));
        }
    }, [totalSelectedAmount]);

    const fetchUnit = useCallback(async () => {
        if (!unitId || !isMounted.current) {
            setError('شناسه واحد معتبر نیست.');
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await apiFetch(`/unites/${unitId}`);
            if (isMounted.current && data) {
                setUnit(data.unit);
                const initialSelected = data.unit.billingMonths.filter(b => b.remaining > 0).map(b => b._id);
                setSelectedBillIds(initialSelected);
                const initialTotal = data.unit.billingMonths
                    .filter(b => b.remaining > 0)
                    .reduce((sum, bill) => sum + bill.remaining, 0);
                setPaymentAmount(String(initialTotal));
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err.message || 'خطا در بارگذاری اطلاعات واحد');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [apiFetch, unitId]);

    useEffect(() => {
        fetchUnit();
    }, [fetchUnit]);

    const handleToggleBill = (billId) => {
        setSelectedBillIds(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        );
    };

    const handleConfirmModal = () => {
        setIsConfirmModalOpen(false);
        executePayment();
    };

    const handleCancelModal = () => {
        setIsConfirmModalOpen(false);
    };

    const handleAmountChange = useCallback((newAmountString) => {
        setPaymentAmount(newAmountString);
    }, []);

    const executePayment = async () => {
        setLoading(true);
        const finalPaymentAmount = parseInt(paymentAmount, 10);
        const payments = selectedBills.map(bill => ({
            billingMonthId: bill._id,
            amount: bill.remaining,
        }));

        try {
            const data = await apiFetch('/payment/start', {
                method: 'POST',
                body: JSON.stringify({
                    unitId: unit._id,
                    totalToCharge: finalPaymentAmount,
                    callbackUrl: `${FRONTEND_BASE_URL}/#/pay/verify`,
                    payments,
                }),
            });
            if (data && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                setError('خطا در شروع تراکنش زرین‌پال.');
            }
        } catch (err) {
            setError(err.message || 'خطا در برقراری ارتباط با درگاه پرداخت.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = (e) => {
        e.preventDefault();
        setError('');
        const finalPaymentAmount = parseInt(paymentAmount, 10);
        if (selectedBillIds.length === 0) {
            setSnackbar({ open: true, message: 'لطفاً حداقل یک بدهی برای پرداخت انتخاب کنید.', severity: 'warning' });
            return;
        }
        if (finalPaymentAmount > totalSelectedAmount) {
            setSnackbar({ open: true, message: 'مبلغ پرداختی نمی‌تواند بیشتر از کل بدهی انتخاب شده باشد.', severity: 'warning' });
            setPaymentAmount(String(totalSelectedAmount));
            return;
        }
        if (finalPaymentAmount <= 0 || isNaN(finalPaymentAmount)) {
            setSnackbar({ open: true, message: 'مبلغ پرداختی باید بیشتر از صفر باشد.', severity: 'warning' });
            return;
        }
        if (finalPaymentAmount < totalSelectedAmount) {
            setIsConfirmModalOpen(true);
        } else {
            executePayment();
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={5}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
            </Container>
        );
    }

    if (!unit) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Alert severity="warning" sx={{ borderRadius: '12px' }}>اطلاعات واحد یافت نشد.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card sx={{ p: 3, background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)' }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#0288d1' }}>
                        صورتحساب واحد {unit.name} ({unit.ownerName})
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2, color: '#0288d1' }}>
                        انتخاب بدهی‌های قابل پرداخت:
                    </Typography>
                    <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                        <Table size="medium">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                    <TableCell padding="checkbox">انتخاب</TableCell>
                                    <TableCell>ماه / سال</TableCell>
                                    <TableCell align="right">مبلغ بدهی (تومان)</TableCell>
                                    <TableCell align="center">وضعیت</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {unpaidBills.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">بدهی معوقی برای این واحد وجود ندارد.</TableCell>
                                    </TableRow>
                                ) : (
                                    unpaidBills.map((bill) => {
                                        const [year, month] = bill.month.split('-');
                                        const monthLabel = months.find(m => m.value === month)?.label || month;
                                        return (
                                            <TableRow key={bill._id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedBillIds.includes(bill._id)}
                                                        onChange={() => handleToggleBill(bill._id)}
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>{monthLabel} {year}</TableCell>
                                                <TableCell align="right">{formatNumberWithCommas(bill.remaining)}</TableCell>
                                                <TableCell align="center" sx={{ color: bill.remaining > 0 ? 'red' : 'green' }}>
                                                    {bill.remaining > 0 ? 'معوق' : 'پرداخت شده'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box mt={3} p={3} border={1} borderColor="primary.light" borderRadius={2} sx={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#0288d1' }}>
                            نهایی‌سازی پرداخت
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" sx={{ color: '#0288d1', fontWeight: 'bold' }}>
                            جمع کل بدهی انتخابی: {formatNumberWithCommas(totalSelectedAmount)} تومان
                        </Typography>
                        <form onSubmit={handleStartPayment}>
                            <AmountInput
                                label="مبلغی که می‌خواهید پرداخت کنید (تومان)"
                                value={paymentAmount}
                                onChange={handleAmountChange}
                                required
                                disabled={totalSelectedAmount === 0}
                                helperText={`حداکثر ${formatNumberWithCommas(totalSelectedAmount)} تومان`}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                sx={{ mt: 3, height: 48, borderRadius: '12px' }}
                                disabled={totalSelectedAmount === 0 || !paymentAmount || parseInt(paymentAmount, 10) <= 0}
                                startIcon={<SendIcon />}
                            >
                                پرداخت از طریق زرین‌پال
                            </Button>
                        </form>
                    </Box>
                </Card>
            </motion.div>
            <ConfirmationModal
                open={isConfirmModalOpen}
                totalAmount={totalSelectedAmount}
                paymentAmount={parseInt(paymentAmount, 10) || 0}
                onConfirm={handleConfirmModal}
                onCancel={handleCancelModal}
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

const PaymentVerifyPage = () => {
    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)' }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#0288d1' }}>
                        در حال اعتبارسنجی پرداخت...
                    </Typography>
                    <CircularProgress sx={{ my: 3 }} />
                    <Typography variant="body1">
                        لطفاً منتظر بمانید. سیستم در حال بررسی وضعیت تراکنش شما با زرین‌پال است.
                    </Typography>
                </Card>
            </motion.div>
        </Container>
    );
};

const App = () => {
    const [route, setRoute] = useState(window.location.hash || '#/');
    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const { token } = React.useContext(AuthContext);
    let Component;
    const path = route.split('#')[1];
    if (!token && path !== '/pay') {
        Component = LoginPage;
    } else if (path.startsWith('/pay/verify')) {
        Component = PaymentVerifyPage;
    } else if (path.startsWith('/pay/')) {
        Component = PaymentPage;
    } else if (path === '/dashboard') {
        Component = ManagerDashboard;
    } else {
        Component = token ? ManagerDashboard : LoginPage;
    }

    return (
        <ThemeProvider theme={theme}>
            <Component />
        </ThemeProvider>
    );
};

const Root = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default Root;