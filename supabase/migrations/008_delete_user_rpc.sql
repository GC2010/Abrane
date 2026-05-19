-- ABRANE — Migration 008 : suppression d'utilisateur par l'admin

CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'Impossible de supprimer votre propre compte.';
  END IF;

  DELETE FROM public.profiles WHERE id = p_id;
  DELETE FROM auth.users WHERE id = p_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_id(uuid) TO authenticated;
