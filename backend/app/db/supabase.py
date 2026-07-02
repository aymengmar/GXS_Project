from supabase import create_client, Client

from app.core.config import settings

# Service-role client — for admin Auth operations and privileged table access.
# Never expose this key to mobile or logs.
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SECRET_KEY,
)

# Anon/publishable client — used only for password-based sign-in so that
# sign_in_with_password never overwrites the admin client's session state.
supabase_auth: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_PUBLISHABLE_KEY,
)
