import { Box, Typography, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { C } from "../../theme/colors";

export default function PageHeader({ title, subtitle, onAdd, addLabel }) {
  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight="800" color={C.navy} letterSpacing={-0.3}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: C.slate, mt: 0.4 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            backgroundColor: C.blue,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
            px: 2.5,
            boxShadow: "none",
            "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" },
          }}
        >
          {addLabel}
        </Button>
      </Box>
      <Divider sx={{ mt: 2, borderColor: C.border }} />
    </Box>
  );
}
