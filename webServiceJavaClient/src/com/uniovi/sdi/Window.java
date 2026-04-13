package com.uniovi.sdi;

import javax.swing.JButton;
import javax.swing.BoxLayout;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;
import javax.swing.border.EmptyBorder;

public class Window {
    public JLabel textMemory;
    JFrame frame;
    JPanel panel;
    JButton updateButton;
    JButton turnOffButton;
    int requests = 0;

    public Window() {
        frame = new JFrame("Aplicación Monitorización");
        frame.setSize(500, 200);
        frame.setLocationRelativeTo(null);

        panel = new JPanel();
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        frame.add(panel);

        updateButton = new JButton("Actualizar Memoria");
        updateButton.setBorder(new EmptyBorder(10, 10, 10, 10));
        updateButton.addActionListener(arg0 -> {
            requests++;
            UpdateMemoryThread thread = new UpdateMemoryThread(Window.this);
            thread.start();
        });
        panel.add(updateButton);

        turnOffButton = new JButton("Apagar Equipo");
        turnOffButton.setBorder(new EmptyBorder(10, 10, 10, 10));
        turnOffButton.addActionListener(arg0 ->
                JOptionPane.showMessageDialog(frame, "Enviado apagar!")
        );
        panel.add(turnOffButton);

        textMemory = new JLabel();
        textMemory.setBorder(new EmptyBorder(10, 10, 10, 10));
        textMemory.setText("Memoria libre:");
        panel.add(textMemory);

        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setVisible(true);
    }

    public void updateMemory(String memory) {
        SwingUtilities.invokeLater(() ->
                textMemory.setText("Memoria libre: " + memory + " (" + requests + ")")
        );
    }

    public static void main(String[] args) {
        new Window();
    }
}

