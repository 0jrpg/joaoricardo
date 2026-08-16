
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://educaturdi.vercel.app';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default function AppLogin() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [webReady, setWebReady] = useState(false);

  const openSite = useCallback(async () => {
    setErro('');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return false;

    const response = await fetch(`${SITE_URL}/api/mobile-handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.code) {
      throw new Error(payload.error ?? 'Não foi possível abrir o EducaTurdi.');
    }

    setWebReady(false);
    setWebUrl(`${SITE_URL}/auth/mobile?code=${encodeURIComponent(payload.code)}`);
    return true;
  }, []);

  useEffect(() => {
    openSite().catch(() => {});
  }, [openSite]);

  async function login() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }

    setErro('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: senha,
      });
      if (error) {
        setErro(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message
        );
        return;
      }
      await openSite();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível conectar.');
    } finally {
      setLoading(false);
    }
  }

  if (webUrl) {
    return (
      <SafeAreaView style={styles.webShell}>
        <StatusBar style="light" />
        {!webReady && (
          <View style={styles.webLoading}>
            <View style={styles.bigLogo}>
              <Ionicons name="school-outline" size={28} color="#fff" />
            </View>
            <ActivityIndicator color="#3dba72" />
            <Text style={styles.webLoadingText}>Abrindo o EducaTurdi…</Text>
          </View>
        )}
        <WebView
          source={{ uri: webUrl }}
          style={[styles.webview, !webReady && { opacity: 0 }]}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          onLoadStart={() => setWebReady(false)}
          onLoadEnd={() => setWebReady(true)}
          onError={() => {
            setWebUrl(null);
            setErro('Não foi possível abrir o EducaTurdi.');
          }}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0a2d1c', '#06190f', '#042713']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="school-outline" size={27} color="#fff" />
            </View>
            <Text style={styles.brand}>
              Educa<Text style={styles.brandAccent}>Turdi</Text>
            </Text>
          </View>

          <View style={styles.hero}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              Sua plataforma{'\n'}escolar <Text style={styles.titleAccent}>completa</Text>
            </Text>
            <Text style={styles.subtitle}>
              Notas, tarefas, provas, apostilas e comunicados em um só lugar.
            </Text>
            <View style={styles.features}>
              <Feature icon="clipboard-outline" text="Atividades e entregas" />
              <Feature icon="analytics-outline" text="Boletim e desempenho" />
              <Feature icon="book-outline" text="Apostilas e materiais" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo de volta 👋</Text>
            <Text style={styles.cardSubtitle}>Entre com sua conta para continuar</Text>

            {erro ? (
              <View style={styles.error}>
                <Ionicons name="alert-circle-outline" size={17} color="#b42318" />
                <Text style={styles.errorText}>{erro}</Text>
              </View>
            ) : null}

            <Field
              label="E-mail"
              icon="mail-outline"
              placeholder="seu.email@educaturdi.edu.br"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Field
              label="Senha"
              icon="lock-closed-outline"
              placeholder="••••••••"
              value={senha}
              onChangeText={setSenha}
              editable={!loading}
              secureTextEntry={!mostrarSenha}
              rightIcon={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setMostrarSenha(v => !v)}
              returnKeyType="done"
              onSubmitEditing={login}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !loading && styles.pressed,
                loading && styles.disabled,
              ]}
              onPress={login}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Verificando…</Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>Entrar na plataforma</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>

            <Text style={styles.footer}>EducaTurdi © 2026 · Plataforma Educacional</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Feature({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={17} color="#3dba72" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function Field(props: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  autoCorrect?: boolean;
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={[styles.inputWrap, props.editable === false && styles.inputDisabled]}>
        <Ionicons name={props.icon} size={19} color="#9aa59e" />
        <TextInput
          style={styles.input}
          placeholder={props.placeholder}
          placeholderTextColor="#aab2ad"
          value={props.value}
          onChangeText={props.onChangeText}
          editable={props.editable}
          secureTextEntry={props.secureTextEntry}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
          autoCorrect={props.autoCorrect}
          returnKeyType={props.returnKeyType}
          onSubmitEditing={props.onSubmitEditing}
        />
        {props.rightIcon && props.onRightIconPress ? (
          <Pressable onPress={props.onRightIconPress} hitSlop={10}>
            <Ionicons name={props.rightIcon} size={19} color="#89958e" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06190f' },
  webShell: { flex: 1, backgroundColor: '#06190f' },
  webview: { flex: 1, backgroundColor: '#fff' },
  webLoading: {
    ...StyleSheet.absoluteFillObject, zIndex: 10, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#06190f', gap: 12,
  },
  bigLogo: {
    width: 58, height: 58, borderRadius: 17, backgroundColor: '#27a05a',
    alignItems: 'center', justifyContent: 'center', marginBottom: 3,
  },
  webLoadingText: { color: 'rgba(255,255,255,.65)', fontSize: 13 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 28 },
  scrollCompact: { paddingHorizontal: 18, paddingTop: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#27a05a',
  },
  brand: { color: '#fff', fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  brandAccent: { color: '#55c881' },
  hero: { paddingTop: 34, paddingBottom: 28 },
  title: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 42, letterSpacing: -0.9 },
  titleCompact: { fontSize: 32, lineHeight: 38 },
  titleAccent: { color: '#55c881', fontStyle: 'italic' },
  subtitle: { marginTop: 14, color: 'rgba(255,255,255,.62)', fontSize: 14.5, lineHeight: 22 },
  features: { marginTop: 22, gap: 10 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center',
    justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.07)',
  },
  featureText: { color: 'rgba(255,255,255,.72)', fontSize: 13.5, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 20,
    paddingTop: 22, paddingBottom: 18, shadowColor: '#000',
    shadowOpacity: .18, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardTitle: { color: '#102018', fontSize: 24, fontWeight: '800', letterSpacing: -.4 },
  cardSubtitle: { color: '#66736b', fontSize: 13.5, marginTop: 5, marginBottom: 20 },
  error: {
    backgroundColor: '#fee4e2', borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start',
    gap: 8, marginBottom: 14,
  },
  errorText: { color: '#b42318', fontSize: 12.5, lineHeight: 18, flex: 1 },
  field: { marginBottom: 14 },
  label: { color: '#344239', fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
  inputWrap: {
    minHeight: 50, borderRadius: 13, borderWidth: 1.4, borderColor: '#dce3de',
    backgroundColor: '#f8faf9', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, gap: 10,
  },
  inputDisabled: { opacity: .65 },
  input: { flex: 1, color: '#142119', fontSize: 14, minHeight: 48, paddingVertical: 0 },
  button: {
    marginTop: 3, minHeight: 51, paddingHorizontal: 15, borderRadius: 13,
    backgroundColor: '#1fa053', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 9, shadowColor: '#1fa053',
    shadowOpacity: .24, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  pressed: { opacity: .92, transform: [{ translateY: 1 }] },
  disabled: { opacity: .62, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
  footer: {
    marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eef1ef',
    textAlign: 'center', color: '#98a39c', fontSize: 11.5,
  },
  glowA: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#1c8f50', opacity: .16, top: -110, left: -80,
  },
  glowB: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#43c47a', opacity: .1, bottom: -120, right: -70,
  },
});
