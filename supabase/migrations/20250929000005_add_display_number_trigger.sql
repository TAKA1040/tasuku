-- Create display_number auto-generation trigger for unified_tasks
-- Format: YYYYMMDDTTCCC (e.g., T001, R001, I001)

CREATE OR REPLACE FUNCTION generate_display_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Skip if display_number is already set (non-empty)
    IF NEW.display_number IS NOT NULL AND NEW.display_number != '' THEN
        RETURN NEW;
    END IF;

    -- Determine prefix based on task_type
    CASE NEW.task_type
        WHEN 'NORMAL' THEN prefix := 'T';
        WHEN 'RECURRING' THEN prefix := 'R';
        WHEN 'IDEA' THEN prefix := 'I';
        ELSE prefix := 'T'; -- Default fallback
    END CASE;

    -- Get next number for this prefix and user
    SELECT COALESCE(
        MAX(
            CASE
                WHEN display_number ~ ('^' || prefix || '[0-9]+$') THEN
                    CAST(SUBSTRING(display_number FROM (LENGTH(prefix) + 1)) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1
    INTO next_number
    FROM unified_tasks
    WHERE user_id = NEW.user_id
    AND display_number LIKE (prefix || '%');

    -- Format as 3-digit number with prefix
    formatted_number := prefix || LPAD(next_number::TEXT, 3, '0');

    -- Set the display_number
    NEW.display_number := formatted_number;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS generate_display_number_trigger ON unified_tasks;
CREATE TRIGGER generate_display_number_trigger
    BEFORE INSERT ON unified_tasks
    FOR EACH ROW
    EXECUTE FUNCTION generate_display_number();

-- Create trigger for UPDATE operations (in case display_number gets cleared)
DROP TRIGGER IF EXISTS update_display_number_trigger ON unified_tasks;
CREATE TRIGGER update_display_number_trigger
    BEFORE UPDATE ON unified_tasks
    FOR EACH ROW
    WHEN (NEW.display_number IS NULL OR NEW.display_number = '')
    EXECUTE FUNCTION generate_display_number();