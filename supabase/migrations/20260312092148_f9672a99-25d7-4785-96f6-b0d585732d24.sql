-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert conversations (for mock data generation)
CREATE POLICY "Admins can insert conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert messages (for mock data generation)
CREATE POLICY "Admins can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all messages
-- (already exists, skip if error)
