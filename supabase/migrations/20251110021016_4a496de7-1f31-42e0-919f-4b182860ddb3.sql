-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'entregador', 'operador');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create bombonas table
CREATE TABLE public.bombonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  capacidade NUMERIC NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel',
  localizacao_atual TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bombonas ENABLE ROW LEVEL SECURITY;

-- Create fichas table (delivery/collection records)
CREATE TABLE public.fichas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bombona_id UUID REFERENCES public.bombonas(id) ON DELETE CASCADE NOT NULL,
  tipo_movimentacao TEXT NOT NULL,
  entregador_id UUID REFERENCES auth.users(id) NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_endereco TEXT NOT NULL,
  cliente_telefone TEXT,
  data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assinatura_url TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bombonas
CREATE POLICY "Authenticated users can view bombonas"
  ON public.bombonas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert bombonas"
  ON public.bombonas FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bombonas"
  ON public.bombonas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bombonas"
  ON public.bombonas FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for fichas
CREATE POLICY "Admins can view all fichas"
  ON public.fichas FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Entregadores can view their own fichas"
  ON public.fichas FOR SELECT
  USING (
    auth.uid() = entregador_id OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins and Entregadores can create fichas"
  ON public.fichas FOR INSERT
  WITH CHECK (
    auth.uid() = entregador_id AND
    (public.has_role(auth.uid(), 'entregador') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Entregadores can update their own fichas"
  ON public.fichas FOR UPDATE
  USING (
    auth.uid() = entregador_id OR
    public.has_role(auth.uid(), 'admin')
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bombonas_updated_at
  BEFORE UPDATE ON public.bombonas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();