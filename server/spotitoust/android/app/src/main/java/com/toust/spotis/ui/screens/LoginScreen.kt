package com.toust.spotis.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.spotis.ui.theme.*
import com.toust.spotis.viewmodel.AuthMode
import com.toust.spotis.viewmodel.AuthUiState
import com.toust.spotis.viewmodel.AuthViewModel
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    val focusManager = LocalFocusManager.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack)
    ) {
        // Ambient background glow
        Box(
            modifier = Modifier
                .size(400.dp)
                .offset(x = (-80).dp, y = 100.dp)
                .background(
                    Brush.radialGradient(listOf(SpotisGreenAlpha10, Color.Transparent)),
                    RoundedCornerShape(50)
                )
        )
        Box(
            modifier = Modifier
                .size(350.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 80.dp, y = (-80).dp)
                .background(
                    Brush.radialGradient(listOf(Color(0x0A1DB954), Color.Transparent)),
                    RoundedCornerShape(50)
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .windowInsetsPadding(WindowInsets.systemBars),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(Modifier.height(32.dp))

            // Logo & Brand
            SpotisLogoComposable(modifier = Modifier.size(72.dp))
            Spacer(Modifier.height(12.dp))
            Text(
                text = "SPOTIS",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Black,
                    letterSpacing = 6.sp,
                    color = SpotisWhite
                )
            )
            Text(
                text = "Escucha a tu manera",
                style = MaterialTheme.typography.labelSmall,
                color = SpotisGray500
            )

            Spacer(Modifier.height(40.dp))

            // Card
            Surface(
                shape = RoundedCornerShape(28.dp),
                color = SpotisDarkPanel.copy(alpha = 0.9f),
                tonalElevation = 0.dp,
                shadowElevation = 0.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, SpotisWhiteAlpha10),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(28.dp)) {

                    // Header
                    Text(
                        text = if (uiState.authMode == AuthMode.SIGN_IN) "Iniciar Sesión" else "Crear Cuenta",
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                        color = SpotisWhite
                    )
                    Text(
                        text = if (uiState.authMode == AuthMode.SIGN_IN)
                            "Entra a tu cuenta de Spotis"
                        else
                            "Regístrate para guardar tu música",
                        style = MaterialTheme.typography.bodySmall,
                        color = SpotisGray400,
                        modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                    )

                    // Tabs
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(SpotisWhiteAlpha10)
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        TabButton(
                            label = "Iniciar Sesión",
                            selected = uiState.authMode == AuthMode.SIGN_IN,
                            onClick = { viewModel.setAuthMode(AuthMode.SIGN_IN); name = ""; email = ""; password = "" },
                            modifier = Modifier.weight(1f)
                        )
                        TabButton(
                            label = "Registrarse",
                            selected = uiState.authMode == AuthMode.SIGN_UP,
                            onClick = { viewModel.setAuthMode(AuthMode.SIGN_UP); name = ""; email = ""; password = "" },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(Modifier.height(20.dp))

                    // Form Fields
                    AnimatedVisibility(visible = uiState.authMode == AuthMode.SIGN_UP) {
                        Column {
                            SpotisTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = "Nombre completo",
                                placeholder = "Tu nombre",
                                icon = Icons.Default.Person,
                                imeAction = ImeAction.Next
                            )
                            Spacer(Modifier.height(12.dp))
                        }
                    }

                    SpotisTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = "Correo electrónico",
                        placeholder = "usuario@correo.com",
                        icon = Icons.Default.Email,
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    )

                    Spacer(Modifier.height(12.dp))

                    SpotisTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = "Contraseña",
                        placeholder = "••••••••",
                        icon = Icons.Default.Lock,
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = SpotisGray500,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        },
                        keyboardActions = KeyboardActions(onDone = {
                            focusManager.clearFocus()
                            if (uiState.authMode == AuthMode.SIGN_IN)
                                viewModel.signInWithEmail(email, password)
                            else
                                viewModel.signUpWithEmail(name, email, password)
                        })
                    )

                    // Error
                    AnimatedVisibility(visible = uiState.error != null) {
                        Text(
                            text = uiState.error ?: "",
                            color = SpotisError,
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    Spacer(Modifier.height(20.dp))

                    // Primary CTA
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            if (uiState.authMode == AuthMode.SIGN_IN)
                                viewModel.signInWithEmail(email, password)
                            else
                                viewModel.signUpWithEmail(name, email, password)
                        },
                        enabled = !uiState.isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SpotisGreen,
                            contentColor = SpotisBlack
                        )
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = SpotisBlack,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = if (uiState.authMode == AuthMode.SIGN_IN) "Entrar" else "Registrarse",
                                fontWeight = FontWeight.Black,
                                fontSize = 15.sp
                            )
                        }
                    }

                    // Divider
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f), color = SpotisWhiteAlpha10)
                        Text(
                            text = "  o  ",
                            style = MaterialTheme.typography.labelSmall,
                            color = SpotisGray500
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f), color = SpotisWhiteAlpha10)
                    }

                    // Google Sign-In
                    OutlinedButton(
                        onClick = { viewModel.signInWithGoogle(context) },
                        enabled = !uiState.isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SpotisWhiteAlpha20),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = SpotisWhite)
                    ) {
                        GoogleIconComposable(modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(
                            text = "Continuar con Google",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    // Spotify Sign-In
                    OutlinedButton(
                        onClick = {
                            scope.launch {
                                val url = viewModel.getSpotifyAuthUrl()
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                context.startActivity(intent)
                            }
                        },
                        enabled = !uiState.isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SpotisGreenAlpha30),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = SpotisWhite)
                    ) {
                        SpotifyIconComposable(
                            modifier = Modifier.size(20.dp),
                            tint = SpotisGreen
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(
                            text = "Iniciar Sesión con Spotify",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

@Composable
private fun TabButton(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(36.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) SpotisGreen else Color.Transparent,
            contentColor = if (selected) SpotisBlack else SpotisGray400
        ),
        elevation = ButtonDefaults.buttonElevation(0.dp)
    ) {
        Text(text = label, fontWeight = FontWeight.Bold, fontSize = 12.sp)
    }
}

@Composable
fun SpotisTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: @Composable (() -> Unit)? = null,
    keyboardActions: KeyboardActions = KeyboardActions.Default
) {
    Column(modifier = modifier) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = SpotisGray400,
            letterSpacing = 1.sp,
            modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = SpotisGray700, fontSize = 13.sp) },
            leadingIcon = {
                Icon(icon, contentDescription = null, tint = SpotisGray500, modifier = Modifier.size(18.dp))
            },
            trailingIcon = trailingIcon,
            visualTransformation = visualTransformation,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
            keyboardActions = keyboardActions,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = SpotisWhite,
                unfocusedTextColor = SpotisWhite,
                focusedBorderColor = SpotisGreen.copy(alpha = 0.5f),
                unfocusedBorderColor = SpotisWhiteAlpha10,
                cursorColor = SpotisGreen,
                focusedContainerColor = SpotisWhiteAlpha10,
                unfocusedContainerColor = SpotisWhiteAlpha10
            ),
            textStyle = MaterialTheme.typography.bodyMedium
        )
    }
}

// Placeholder composables for icons — implement with actual SVG paths
@Composable
fun SpotisLogoComposable(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .background(SpotisDarkCard, RoundedCornerShape(24.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text("S", color = SpotisGreen, fontWeight = FontWeight.Black, fontSize = 32.sp)
    }
}

@Composable
fun GoogleIconComposable(modifier: Modifier = Modifier) {
    // Using text fallback; replace with actual Google SVG via Canvas or vector drawable
    Text("G", modifier = modifier, color = Color(0xFF4285F4), fontWeight = FontWeight.Black, fontSize = 16.sp)
}

@Composable
fun SpotifyIconComposable(modifier: Modifier = Modifier, tint: Color = SpotisGreen) {
    Icon(
        imageVector = Icons.Default.MusicNote,
        contentDescription = "Spotify",
        tint = tint,
        modifier = modifier
    )
}
